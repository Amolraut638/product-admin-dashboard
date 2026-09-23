'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { Lock, User } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { loginApi } from '@/services/auth.service';

/**
 * /login — authentication page.
 *
 * Flow:
 *  1. While isLoading → show spinner (localStorage is being read)
 *  2. If already authenticated → redirect to /products (no flash)
 *  3. Otherwise → show login form
 *  4. On submit:
 *     - validate fields (no API call for empty fields)
 *     - set isSubmitting = true (disables button — prevents duplicate requests)
 *     - call loginApi() via auth.service.ts (never calls Axios directly)
 *     - on success: login(token, user) → router.push('/products')
 *     - on error: show user-friendly message, reset isSubmitting
 */
export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect already-authenticated users away from /login
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/products');
    }
  }, [isAuthenticated, isLoading, router]);

  const set =
    (field: 'username' | 'password') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.username.trim()) e.username = 'Username is required.';
    if (!form.password)        e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Guard 1: prevent duplicate requests — React state ensures this is
    // synchronous and only one request can be in-flight at a time.
    if (isSubmitting) return;

    // Guard 2: client-side validation — no API call for empty fields
    if (!validate()) return;

    setServerError('');
    setIsSubmitting(true);

    try {
      // All Axios logic stays in the service — the page only calls the function
      const user = await loginApi({
        username: form.username.trim(),
        password: form.password,
      });

      // Persist token + user, sync Axios, update React state
      login(user.accessToken, user);

      // Redirect to the dashboard
      router.push('/products');
    } catch (err: unknown) {
      // Translate API errors into user-friendly messages.
      // DummyJSON returns HTTP 400 for invalid credentials.
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 400 || status === 401) {
          setServerError('Invalid username or password.');
        } else if (status === 429) {
          setServerError('Too many requests. Please wait a moment and try again.');
        } else if (!err.response) {
          setServerError('Unable to connect. Please check your internet connection.');
        } else {
          setServerError('Something went wrong. Please try again.');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      // Always reset submitting state so the form is usable after an error
      setIsSubmitting(false);
    }
  }

  // ── Loading state: restoring auth from localStorage ──────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span
          className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  // ── Already authenticated: suppress flash while redirect is pending ───────
  if (isAuthenticated) return null;

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px] bg-white border border-gray-200 rounded-2xl shadow-sm px-8 py-10">

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Product Admin
          </h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {/* Server / API error */}
        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="login-username"
            label="Username"
            type="text"
            placeholder="emilys"
            icon={User}
            value={form.username}
            onChange={set('username')}
            error={errors.username}
            autoComplete="username"
            disabled={isSubmitting}
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            autoComplete="current-password"
            disabled={isSubmitting}
          />

          {/*
            isSubmitting disables the button at the React level — even rapid
            clicks will not trigger a second API request because handleSubmit
            returns early when isSubmitting is true.
          */}
          <Button
            id="login-submit"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full mt-1"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
