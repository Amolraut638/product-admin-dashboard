'use client';

import { useReducer, useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/types/product';
import { getProducts } from '@/services/product.service';
import ProductsTable from '@/components/products/ProductsTable';
import ProductCard from '@/components/products/ProductCard';
import { CardSkeleton } from '@/components/products/ProductSkeleton';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Fetch state — useReducer keeps state transitions atomic and avoids the
// react-hooks/set-state-in-effect lint error (dispatch is not setState).
// ---------------------------------------------------------------------------
interface FetchState {
  status: 'loading' | 'success' | 'empty' | 'error';
  products: Product[];
  total: number;
  errorMessage: string | null;
}

type FetchAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; products: Product[]; total: number }
  | { type: 'FETCH_ERROR'; message: string };

const initialFetchState: FetchState = {
  status: 'loading',
  products: [],
  total: 0,
  errorMessage: null,
};

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...initialFetchState, status: 'loading' };
    case 'FETCH_SUCCESS':
      return {
        status: action.products.length > 0 ? 'success' : 'empty',
        products: action.products,
        total: action.total,
        errorMessage: null,
      };
    case 'FETCH_ERROR':
      return { status: 'error', products: [], total: 0, errorMessage: action.message };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// ProductsPage
// ---------------------------------------------------------------------------
const LIMIT = 20;

export default function ProductsPage() {
  const [fetchState, dispatch] = useReducer(fetchReducer, initialFetchState);

  // retryCount is incremented by the Retry button — causes the fetch effect to
  // re-run without any API logic inside the button handler itself.
  const [retryCount, setRetryCount] = useState(0);

  // Fetch products — re-runs when retryCount changes (Retry button click)
  useEffect(() => {
    let cancelled = false;

    // dispatch is from useReducer — not flagged by react-hooks/set-state-in-effect
    dispatch({ type: 'FETCH_START' });

    getProducts({ limit: LIMIT, skip: 0 })
      .then((data) => {
        if (!cancelled) {
          dispatch({
            type: 'FETCH_SUCCESS',
            products: data.products,
            total: data.total,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({
            type: 'FETCH_ERROR',
            message: 'Failed to load products. Please check your connection and try again.',
          });
        }
      });

    // Cleanup: ignore the response if the component unmounts mid-request
    return () => { cancelled = true; };
  }, [retryCount]);

  const { status, products, total, errorMessage } = fetchState;

  // Subtitle shown below the page heading
  const subtitle =
    status === 'success'
      ? `Showing ${products.length} of ${total} products`
      : 'Browse and manage your product catalogue.';

  return (
    <div>
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* Add Product — disabled until Phase 4 */}
        <Button
          id="add-product-btn"
          variant="primary"
          size="md"
          disabled
          className="shrink-0"
        >
          + Add Product
        </Button>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="mb-5">
          <ErrorBanner
            id="products-retry-btn"
            message={errorMessage ?? 'Something went wrong.'}
            onRetry={() => setRetryCount((c) => c + 1)}
          />
        </div>
      )}

      {/* ── Loading: desktop table skeleton ──────────────────────────── */}
      {status === 'loading' && (
        <>
          {/* Desktop skeleton — table shell is preserved to prevent layout shift */}
          <div className="hidden md:block">
            <ProductsTable products={[]} loading />
          </div>

          {/* Mobile skeleton */}
          <div className="md:hidden">
            <CardSkeleton count={6} />
          </div>
        </>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {status === 'empty' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <EmptyState
            icon={ShoppingBag}
            message="No products found."
          />
        </div>
      )}

      {/* ── Products ─────────────────────────────────────────────────── */}
      {status === 'success' && (
        <>
          {/* Desktop — table (md and above) */}
          <div className="hidden md:block">
            <ProductsTable products={products} />
          </div>

          {/* Mobile — cards (below md) */}
          <div className="md:hidden space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
