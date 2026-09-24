import { Suspense } from 'react';
import ProductDetails from '@/components/products/ProductDetails';
import { ProductDetailSkeleton } from '@/components/products/ProductSkeleton';

/**
 * /products/[id] — product detail page.
 *
 * This is a Server Component.  `params` is a Promise in Next.js 15+ App Router.
 *
 * It passes the raw `id` string down to ProductDetails (Client Component).
 * ProductDetails owns ID validation, fetching, and all UI states:
 *   • loading   — skeleton shown while fetching
 *   • success   — image gallery + info + reviews
 *   • notFound  — invalid string ("abc", "-1") or HTTP 404 ("999999")
 *   • error     — network/server failure with Retry button
 *
 * `key={id}` on ProductDetails forces a clean React remount whenever the
 * product ID changes, resetting all internal state (selectedImageIdx, etc.)
 * without needing a useEffect.
 *
 * Authentication: the (dashboard) route group's middleware/layout already
 * redirects unauthenticated users to /login — no extra protection needed here.
 */

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetails key={id} id={id} />
    </Suspense>
  );
}
