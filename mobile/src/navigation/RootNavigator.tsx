import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

type Props = { fallback: ReactNode };

export function RootNavigator({ fallback }: Props) {
  const { user, isRestoring } = useAuth();

  if (isRestoring) return fallback;
  return user ? <AppNavigator /> : <AuthNavigator />;
}
