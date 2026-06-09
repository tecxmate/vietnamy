import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  loadProgressFromCloud,
  saveProgressToCloud,
  debouncedSaveProgress,
  ensureUserProfile,
  getProfileFromAuthUser,
  PROGRESS_CHANGED_EVENT,
} from '../lib/syncProgress';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // No Supabase config — allow local dev without auth
      const localUser = { id: 'local-dev', email: 'dev@local', user_metadata: {} };
      setUser(localUser);
      setProfile(getProfileFromAuthUser(localUser));
      setLoading(false);
      return;
    }

    const hydrateSession = async (session, event = 'INITIAL_SESSION') => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (!newUser) {
        setProfile(null);
        return;
      }

      // Strip OAuth hash fragment (#access_token=...) from the URL so React
      // Router and downstream components don't trip over it on first render.
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      const cloudProfile = await ensureUserProfile(newUser);
      setProfile(cloudProfile);

      // Check if user has cloud data to restore.
      const hasOnboarding = localStorage.getItem('vnme_onboarding_completed') === 'true';
      const loaded = await loadProgressFromCloud(newUser.id);

      if (loaded && !hasOnboarding && event === 'SIGNED_IN') {
        // Cloud data restored to localStorage — navigate to a clean URL to
        // discard the OAuth hash fragment (#access_token=...) before the
        // app re-renders with the restored state.
        window.location.replace(window.location.origin + '/');
      } else if (hasOnboarding) {
        // User has local progress — push to cloud under auth.users.id.
        await saveProgressToCloud(newUser.id);
      }

      const refreshedProfile = await ensureUserProfile(newUser);
      setProfile(refreshedProfile);
    };

    // Race getSession against a timeout so the app never stays stuck on "Loading..."
    const sessionPromise = supabase.auth.getSession().then(({ data: { session } }) => {
      return hydrateSession(session);
    });
    const timeout = new Promise(resolve => setTimeout(resolve, 5000));
    Promise.race([sessionPromise, timeout]).catch(() => {}).finally(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      await hydrateSession(session, event);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Google sign-in error:', error.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign-out error:', error.message);
  };

  const syncProgress = useCallback(() => {
    if (user) debouncedSaveProgress(user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const handleProgressChanged = () => debouncedSaveProgress(user.id);
    window.addEventListener(PROGRESS_CHANGED_EVENT, handleProgressChanged);
    return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, handleProgressChanged);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, syncProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
