import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setApiToken } from '../services/api';
import type { LoginInput, Session, User } from '../types/auth';

const SESSION_KEY = '@gestao-veicular:session';

type AuthContextValue = {
  user: User | null;
  isRestoring: boolean;
  signIn(input: LoginInput): Promise<void>;
  signOut(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (!storedSession) return;

        const parsedSession = JSON.parse(storedSession) as Session;
        if (!parsedSession.token || !parsedSession.user) {
          await AsyncStorage.removeItem(SESSION_KEY);
          return;
        }

        setApiToken(parsedSession.token);
        setSession(parsedSession);
      } catch {
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    isRestoring,
    async signIn(input) {
      const newSession = await authService.login(input);
      setApiToken(newSession.token);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);
    },
    async signOut() {
      setApiToken(null);
      await AsyncStorage.removeItem(SESSION_KEY);
      setSession(null);
    },
  }), [isRestoring, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
