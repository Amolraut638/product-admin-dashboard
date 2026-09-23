'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, setUnauthorizedCallback } from '@/lib/axios';
import type { User } from '@/types/auth';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'product_admin_token';
const USER_KEY  = 'product_admin_user';

// ---------------------------------------------------------------------------
// Reducer — dispatch() is not flagged by react-hooks/set-state-in-effect
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
      return { session: { token: action.token, user: action.user }, isLoading: false };
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
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [{ session, isLoading }, dispatch] = useReducer(authReducer, initialState);

  // Ref holds the latest logout function so the Axios 401 callback (registered
  // once on mount) always calls the up-to-date closure without needing to
  // re-register itself. The ref is updated inside an effect — never during
  // render — to satisfy the react-hooks/refs rule.
  const logoutRef = useRef<(() => void) | null>(null);

  // Effect 1: Restore persisted session from localStorage on first render.
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
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      dispatch({ type: 'LOADED' });
    }
  }, []);

  // Effect 2: Register the Axios 401 callback once on mount.
  // Uses logoutRef (stable identity) so the deps array is empty — the
  // callback always reaches the latest logout via the ref indirection.
  useEffect(() => {
    setUnauthorizedCallback(() => { logoutRef.current?.(); });
    return () => { setUnauthorizedCallback(null); };
  }, []);

  // Auth action functions — plain functions; the React Compiler (included in
  // Next.js 16) handles memoization automatically, so manual useCallback is
  // intentionally omitted to satisfy react-hooks/preserve-manual-memoization.
  function login(newToken: string, newUser: User) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setAuthToken(newToken);
    dispatch({ type: 'LOGIN', token: newToken, user: newUser });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
    router.replace('/login');
  }

  // Effect 3: Keep logoutRef in sync with the latest logout closure.
  // This runs after every render where logout has changed, inside an effect
  // so we never touch the ref during render (satisfies react-hooks/refs).
  useEffect(() => {
    logoutRef.current = logout;
  });

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
