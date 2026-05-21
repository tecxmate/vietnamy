import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loadProgressFromCloud, saveProgressToCloud, debouncedSaveProgress } from '../lib/syncProgress';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // No Supabase config — allow local dev without auth
      setUser({ id: 'local-dev', email: 'dev@local' });
      setLoading(false);
      return;
    }

    // Race getSession against a timeout so the app never stays stuck on "Loading..."
    const sessionPromise = supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const timeout = new Promise(resolve => setTimeout(resolve, 5000));
    Promise.race([sessionPromise, timeout]).catch(() => {}).finally(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser && _event === 'SIGNED_IN') {
        // Strip OAuth hash fragment (#access_token=...) from the URL so React
        // Router and downstream components don't trip over it on first render.
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Check if user has cloud data to restore
        const hasOnboarding = localStorage.getItem('vnme_onboarding_completed') === 'true';
        const loaded = await loadProgressFromCloud(newUser.id);

        if (loaded && !hasOnboarding) {
          // Cloud data restored to localStorage — navigate to a clean URL to
          // discard the OAuth hash fragment (#access_token=...) before the
          // app re-renders with the restored state.
          window.location.replace(window.location.origin + '/');
        } else if (hasOnboarding) {
          // User has local progress — push to cloud
          await saveProgressToCloud(newUser.id);
        }
      }
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

  // Extract useful fields from user metadata
  const profile = user ? {
    email: user.email,
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatarUrl: user.user_metadata?.avatar_url || '',
  } : null;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, syncProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
