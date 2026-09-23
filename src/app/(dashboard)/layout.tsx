'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';

/**
 * (dashboard)/layout.tsx — Auth guard + shell for all dashboard pages.
 *
 * Behaviour:
 *   - While the auth state is being restored from localStorage → spinner
 *   - Unauthenticated → redirect to /login
 *   - Authenticated → render AppLayout (Sidebar + Topbar + main)
 *
 * All dashboard routes (/products, /products/[id], …) share this layout.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show a full-screen spinner while localStorage is being read
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

  // Suppress flash of authenticated UI while the redirect navigates
  if (!isAuthenticated) return null;

  return <AppLayout>{children}</AppLayout>;
}
