import axios from 'axios';

// ---------------------------------------------------------------------------
// Module-level token store.
// AuthContext calls setAuthToken() on login/logout/hydration so that the
// request interceptor below can attach the Bearer token without creating a
// circular dependency between AuthContext and this module.
// ---------------------------------------------------------------------------
let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

// ---------------------------------------------------------------------------
// Shared Axios instance — all API calls go through this
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

// Response interceptor — centralized error handling
// 401 redirect to /login will be wired in Phase 2 once auth is complete
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
