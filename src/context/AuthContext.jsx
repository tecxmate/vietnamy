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
        // Check if user has cloud data to restore
        const hasOnboarding = localStorage.getItem('vnme_onboarding_completed') === 'true';
        const loaded = await loadProgressFromCloud(newUser.id);

        if (loaded && !hasOnboarding) {
          // Cloud data restored to localStorage — reload to pick up state
          window.location.reload();
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
