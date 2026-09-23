'use client';

import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

/**
 * /login — authentication page.
 *
 * Phase 1: form structure + validation UI are in place.
 * Phase 2: will wire loginApi() + useAuth().login() + redirect to /products.
 *
 * DummyJSON credentials: username=emilys / password=emilyspass
 */
export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!validate()) return;
    setServerError('');
    setLoading(true);

    // TODO Phase 2: call loginApi(), then useAuth().login(), then router.push('/products')
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    setServerError('Login API will be connected in Phase 2.');
    setLoading(false);
  }

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

        {/* Server error */}
        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
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
          />

          <Button
            id="login-submit"
            type="submit"
            loading={loading}
            className="w-full mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
