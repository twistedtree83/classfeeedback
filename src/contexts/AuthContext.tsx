import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase, User, getCurrentUser } from '../lib/supabase';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: string | null}>;
  signUp: (email: string, password: string, fullName: string, title: string) => Promise<{error: string | null}>;
  signOut: () => Promise<{error: string | null}>;
  resetPassword: (email: string) => Promise<{error: string | null}>;
  updatePassword: (password: string) => Promise<{error: string | null}>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for current user on mount
  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (user) setUser(user);
      return { error: error?.message || null };
    },
    signUp: async (email: string, password: string, fullName: string, title: string) => {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            title: title
          }
        }
      });
      if (user) setUser(user);
      return { error: error?.message || null };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) setUser(null);
      return { error: error?.message || null };
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error?.message || null };
    },
    updatePassword: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message || null };
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};