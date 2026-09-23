import axios from 'axios';

// ---------------------------------------------------------------------------
// Module-level token store.
// AuthContext calls setAuthToken() on login/logout/hydration so the request
// interceptor can attach the Bearer token without a circular dependency.
// ---------------------------------------------------------------------------
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

// ---------------------------------------------------------------------------
// Unauthorized callback — registered by AuthContext after mount.
// Avoids window.location.href so Next.js router handles the redirect,
// satisfying the @next/next/no-location-assign-relative-destination rule.
// ---------------------------------------------------------------------------
let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedCallback(cb: (() => void) | null): void {
  _onUnauthorized = cb;
}

// ---------------------------------------------------------------------------
// Shared Axios instance — the ONLY Axios instance used by the application.
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: 'https://dummyjson.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token when available
apiClient.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

// Response interceptor — centralized error handling.
// A 401 from any authenticated endpoint means the token is expired/invalid.
// We clear the stored token and delegate the redirect to AuthContext via the
// registered callback, which uses useRouter() instead of window.location.
// Note: DummyJSON returns 400 (not 401) for bad login credentials, so this
// interceptor will not fire during the login flow.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setAuthToken(null);
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
