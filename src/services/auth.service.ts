import apiClient from '@/lib/axios';
import type { LoginCredentials, User } from '@/types/auth';

// POST /auth/login
export async function loginApi(credentials: LoginCredentials): Promise<User> {
  const response = await apiClient.post<User>('/auth/login', credentials);
  return response.data;
}

// POST /auth/refresh  (Phase 2 — token refresh)
// export async function refreshTokenApi(refreshToken: string): Promise<User> {
//   const response = await apiClient.post<User>('/auth/refresh', { refreshToken });
//   return response.data;
// }
