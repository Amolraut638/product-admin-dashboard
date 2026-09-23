import { redirect } from 'next/navigation';

/**
 * Root route "/" — immediately redirects to /products.
 * If the user is unauthenticated, (dashboard)/layout.tsx will
 * redirect them onward to /login.
 */
export default function RootPage() {
  redirect('/products');
}
