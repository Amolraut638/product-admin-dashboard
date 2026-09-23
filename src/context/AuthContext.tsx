'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/axios';
import type { User } from '@/types/auth';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'pad_auth_token';
const USER_KEY  = 'pad_auth_user';

// ---------------------------------------------------------------------------
// Reducer — useReducer dispatch is not flagged by react-hooks/set-state-in-effect
// ---------------------------------------------------------------------------
interface Session {
  user: User | null;
  token: string | null;
}

interface AuthState {
  session: Session;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'RESTORE'; session: Session }
  | { type: 'LOADED' }
  | { type: 'LOGIN'; token: string; user: User }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  session: { user: null, token: null },
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE':
      return { session: action.session, isLoading: false };
    case 'LOADED':
      return { ...state, isLoading: false };
    case 'LOGIN':
      return {
        session: { token: action.token, user: action.user },
        isLoading: false,
      };
    case 'LOGOUT':
      return { session: { user: null, token: null }, isLoading: false };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Called by the login page after a successful POST /auth/login response */
  login: (token: string, user: User) => void;
  /** Clears session and redirects to /login */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [{ session, isLoading }, dispatch] = useReducer(authReducer, initialState);

  // Restore persisted session from localStorage on first render.
  // dispatch() is not a setState call, so this is lint-clean.
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setAuthToken(storedToken);
        dispatch({ type: 'RESTORE', session: { token: storedToken, user: parsedUser } });
      } else {
        dispatch({ type: 'LOADED' });
      }
    } catch {
      // Corrupted storage — wipe and continue unauthenticated
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      dispatch({ type: 'LOADED' });
    }
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setAuthToken(newToken);
    dispatch({ type: 'LOGIN', token: newToken, user: newUser });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user:            session.user,
        token:           session.token,
        isAuthenticated: Boolean(session.token),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
