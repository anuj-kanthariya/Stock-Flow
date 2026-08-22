import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { syncGoogleTokens } from '@/lib/api/google';
import { getCurrentUserProfile, UserProfile } from '@/lib/api/users';

export interface User extends UserProfile {}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // We no longer just map the Supabase user, we fetch from backend
  const fetchAndSetUser = async (sbUser: SupabaseUser | null) => {
    if (!sbUser) {
      setUser(null);
      return;
    }
    
    try {
      const profile = await getCurrentUserProfile();
      setUser(profile);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      // Fallback if backend is unreachable or profile missing
      setUser({
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email || 'User',
        email: sbUser.email,
        role: 'owner',
        is_active: true,
        profile_completed: false,
        invoice_prefix: 'INV',
        invoice_numbering_preference: 'sequential',
        created_at: new Date().toISOString()
      } as User);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchAndSetUser(session?.user ?? null);
      
      if (session?.provider_token) {
        try {
          await syncGoogleTokens(session.provider_token, session.provider_refresh_token ?? undefined);
        } catch (err) {
          console.error("Failed to sync Google tokens on init", err);
        }
      }
    } catch (error) {
      console.error("Error checking auth session:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await fetchAndSetUser(session?.user ?? null);
        
        if (session?.provider_token) {
          try {
            await syncGoogleTokens(session.provider_token, session.provider_refresh_token ?? undefined);
          } catch (err) {
            console.error("Failed to sync Google tokens on auth change", err);
          }
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    queryClient.clear();
    navigate('/auth', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
