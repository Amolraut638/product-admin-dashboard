import { Suspense } from 'react';
import ProductsContent from '@/components/products/ProductsContent';
import { CardSkeleton } from '@/components/products/ProductSkeleton';

/**
 * /products — product listing page.
 *
 * ProductsContent is a Client Component that calls useSearchParams().
 * Next.js App Router requires any component using useSearchParams() to be
 * wrapped in a <Suspense> boundary so the server can render the fallback
 * while the client bundle loads.
 *
 * This page is intentionally a Server Component (no 'use client') so that
 * the Suspense boundary is established at the server level.
 */
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingFallback />}>
      <ProductsContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Fallback — shown while ProductsContent's client bundle loads.
// Mirrors the real page structure so there is no layout shift on hydration.
// ---------------------------------------------------------------------------
function ProductsLoadingFallback() {
  return (
    <div>
      {/* Heading skeleton */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-full animate-pulse shrink-0" />
      </div>

      {/* Desktop: blank card (table will appear in ProductsContent) */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="h-96 animate-pulse" />
      </div>

      {/* Mobile: card skeletons */}
      <div className="md:hidden">
        <CardSkeleton count={6} />
      </div>
    </div>
  );
}
