'use client';

import { useReducer, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/types/product';
import { getProducts } from '@/services/product.service';
import {
  parsePage,
  parseLimit,
  calcSkip,
  calcTotalPages,
  getResultRange,
} from '@/lib/pagination';
import type { PageSize } from '@/lib/pagination';
import ProductsTable from './ProductsTable';
import ProductCard from './ProductCard';
import { CardSkeleton } from './ProductSkeleton';
import Pagination from '@/components/table/Pagination';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Fetch state — useReducer for atomic transitions.
// dispatch() is not flagged by the react-hooks/set-state-in-effect lint rule.
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
      return {
        status: 'error',
        products: [],
        total: 0,
        errorMessage: action.message,
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// ProductsContent
//
// Must be rendered inside a <Suspense> boundary (see products/page.tsx)
// because it calls useSearchParams() — a Next.js App Router requirement.
// ---------------------------------------------------------------------------
export default function ProductsContent() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  // URL is the single source of truth — re-parsed on every render.
  const page  = parsePage(searchParams.get('page'));
  const limit = parseLimit(searchParams.get('limit'));

  // retryCount: incremented by the Retry button click handler (never inside
  // a useEffect) — triggers the fetch effect to re-run for the current page.
  const [retryCount, setRetryCount] = useState(0);

  // Fetch state via useReducer (dispatch is lint-safe in effects).
  const [fetchState, dispatch] = useReducer(fetchReducer, initialFetchState);

  // ── Destructure fetch state for use in Effect 3 dependencies ────────────
  const { status, products, total, errorMessage } = fetchState;

  // ── Effect 1: Normalize invalid URL params ───────────────────────────────
  //
  // Compares the raw URL string values against the parsed (valid) values.
  // If they differ, replaces the URL once.  After the replace, raw === parsed
  // so the effect is a no-op on subsequent runs — no redirect loop.
  useEffect(() => {
    const rawPage  = searchParams.get('page')  ?? '';
    const rawLimit = searchParams.get('limit') ?? '';

    // Compute inside the effect so no extra deps are needed
    const normalizedPage  = parsePage(rawPage  || null);
    const normalizedLimit = parseLimit(rawLimit || null);

    if (rawPage !== String(normalizedPage) || rawLimit !== String(normalizedLimit)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page',  String(normalizedPage));
      params.set('limit', String(normalizedLimit));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, router, pathname]);

  // ── Effect 2: Fetch products ─────────────────────────────────────────────
  //
  // Re-runs when page, limit, or retryCount changes.
  // Cleanup flag prevents stale responses from updating state after unmount
  // or when the user navigates before a slow response arrives.
  useEffect(() => {
    let cancelled = false;

    // dispatch (useReducer) is intentionally called synchronously inside the
    // effect — it is NOT setState, so react-hooks/set-state-in-effect is safe.
    dispatch({ type: 'FETCH_START' });

    getProducts({ limit, skip: calcSkip(page, limit) })
      .then((data) => {
        if (!cancelled) {
          dispatch({
            type: 'FETCH_SUCCESS',
            products: data.products,
            total:    data.total,
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

    return () => { cancelled = true; };
  }, [page, limit, retryCount]);

  // ── Effect 3: Correct page > totalPages after data arrives ───────────────
  //
  // Example: /products?page=999&limit=20, but total=194, totalPages=10.
  // After the fetch resolves (status becomes 'success' or 'empty' with a
  // known total), this effect replaces the URL with the last valid page.
  // It preserves all other existing params (search, category, sort — future).
  // Guard: only redirects once; after redirect page <= totalPages so it stops.
  useEffect(() => {
    if (status !== 'success' && status !== 'empty') return;
    if (total === 0) return; // genuinely empty catalogue — don't redirect

    const totalPages = calcTotalPages(total, limit);
    if (page > totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(totalPages));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [status, total, page, limit, router, pathname, searchParams]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  //
  // Uses URLSearchParams to preserve any existing query params (search,
  // category, sort) that later phases will add.  Only page and limit are
  // touched here.

  function buildParams(newPage: number, newLimit: PageSize): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page',  String(newPage));
    params.set('limit', String(newLimit));
    return params.toString();
  }

  function handlePageChange(newPage: number) {
    router.replace(`${pathname}?${buildParams(newPage, limit)}`);
  }

  function handlePageSizeChange(newLimit: PageSize) {
    // Always reset to page 1 when page size changes to avoid an invalid page
    router.replace(`${pathname}?${buildParams(1, newLimit)}`);
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalPages = calcTotalPages(total, limit);

  const subtitle =
    status === 'success'
      ? getResultRange(page, limit, total)
      : 'Browse and manage your product catalogue.';

  // ── Shared pagination props ───────────────────────────────────────────────
  const paginationProps = {
    currentPage:        page,
    totalPages,
    totalItems:         total,
    pageSize:           limit,
    onPageChange:       handlePageChange,
    onPageSizeChange:   handlePageSizeChange,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
        {/* Add Product — available in a future phase */}
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

      {/* Error banner */}
      {status === 'error' && (
        <div className="mb-5">
          <ErrorBanner
            id="products-retry-btn"
            message={errorMessage ?? 'Something went wrong.'}
            onRetry={() => setRetryCount((c) => c + 1)}
          />
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {status === 'loading' && (
        <>
          {/* Desktop: keep table shell so layout doesn't shift on success */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <ProductsTable products={[]} loading />
          </div>
          {/* Mobile */}
          <div className="md:hidden">
            <CardSkeleton count={6} />
          </div>
        </>
      )}

      {/* ── Empty ───────────────────────────────────────────────────────── */}
      {status === 'empty' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <EmptyState icon={ShoppingBag} message="No products found." />
        </div>
      )}

      {/* ── Success ─────────────────────────────────────────────────────── */}
      {status === 'success' && (
        <>
          {/* Desktop: table + pagination in one card */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <ProductsTable products={products} />
            <div className="border-t border-gray-100">
              <Pagination {...paginationProps} />
            </div>
          </div>

          {/* Mobile: stacked cards + pagination card below */}
          <div className="md:hidden">
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <Pagination {...paginationProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
