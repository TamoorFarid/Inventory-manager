import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { authService } from '@/services/authService';
import type { LoginValues } from '@/lib/validators';
import type { Profile } from '@/types/domain';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: Profile | null;
  session: Session | null;
  user: User | null;
  refreshProfile: () => Promise<void>;
  signIn: (values: LoginValues) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncProfile = useCallback(async (nextSession: Session | null) => {
    const nextProfile = await authService.getCurrentProfile(nextSession);
    startTransition(() => {
      setSession(nextSession);
      setProfile(nextProfile);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then(async (currentSession) => {
        if (!mounted) {
          return;
        }

        void syncProfile(currentSession);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      void syncProfile(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const refreshProfile = useCallback(async () => {
    const latestSession = await authService.getSession();
    await syncProfile(latestSession);
  }, [syncProfile]);

  const signIn = useCallback(async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const { session: nextSession } = await authService.signIn(values);
      await syncProfile(nextSession);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [syncProfile]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    startTransition(() => {
      setSession(null);
      setProfile(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.user),
      isLoading,
      profile,
      refreshProfile,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [isLoading, profile, refreshProfile, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
