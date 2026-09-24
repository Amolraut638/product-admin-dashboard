'use client';

import { useReducer, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { isCancel } from 'axios';
import type { Product } from '@/types/product';
import { getProducts, searchProducts } from '@/services/product.service';
import { useDebounce } from '@/hooks/useDebounce';
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
import SearchInput from './SearchInput';
import { CardSkeleton } from './ProductSkeleton';
import Pagination from '@/components/table/Pagination';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Fetch state — useReducer for atomic, lint-safe state transitions.
// dispatch() from useReducer is NOT flagged by react-hooks/set-state-in-effect.
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
// ProductsContent
//
// Must be rendered inside a <Suspense> boundary (see products/page.tsx)
// because it calls useSearchParams() — a Next.js App Router requirement.
// ---------------------------------------------------------------------------
export default function ProductsContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // ── URL as source of truth ────────────────────────────────────────────────
  // Page and limit are re-parsed on every render from searchParams.
  const page      = parsePage(searchParams.get('page'));
  const limit     = parseLimit(searchParams.get('limit'));
  // urlSearch is what the API and pagination use — comes from the URL.
  const urlSearch = searchParams.get('search') ?? '';

  // ── Local input state ─────────────────────────────────────────────────────
  // inputValue drives the visible text in the search box and is responsive
  // to every keystroke.  It is initialized once from the URL on mount so that
  // a direct URL like /products?search=phone pre-fills the input correctly.
  const [inputValue, setInputValue] = useState(urlSearch);

  // Debounced copy of inputValue — only settles after 450 ms of no typing.
  // The setState inside useDebounce runs inside setTimeout (async), so it
  // is NOT flagged by the react-hooks/set-state-in-effect lint rule.
  const debouncedSearch = useDebounce(inputValue, 450);

  // retryCount: incremented in event handlers only — never inside useEffect.
  const [retryCount, setRetryCount] = useState(0);

  // Fetch state managed by useReducer (dispatch is lint-safe in effects).
  const [fetchState, dispatch] = useReducer(fetchReducer, initialFetchState);

  // Destructure for Effect 3 dependencies (avoids referencing whole object).
  const { status, products, total, errorMessage } = fetchState;

  // ── Effect 1: Normalize invalid page/limit URL params ────────────────────
  //
  // Compares raw URL strings against parsed (valid) values.
  // If they differ, replaces the URL once — no redirect loop because after
  // the replace, raw === parsed and the guard short-circuits.
  useEffect(() => {
    const rawPage  = searchParams.get('page')  ?? '';
    const rawLimit = searchParams.get('limit') ?? '';
    const normalizedPage  = parsePage(rawPage  || null);
    const normalizedLimit = parseLimit(rawLimit || null);

    if (rawPage !== String(normalizedPage) || rawLimit !== String(normalizedLimit)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page',  String(normalizedPage));
      params.set('limit', String(normalizedLimit));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, router, pathname]);

  // ── Effect 2: Sync debounced input → URL ─────────────────────────────────
  //
  // Runs after the debounce period has elapsed with no new keystrokes.
  // Only updates the URL when the debounced value differs from what is
  // already in the URL — preventing a no-op router.replace on every render.
  //
  // Crucially, this also resets page to 1 whenever the search query changes,
  // so the user starts at the first page of new results.
  //
  // router.replace is NOT setState — this effect is lint-safe.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlSearch) return; // already in sync — nothing to do

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // always reset to page 1 on search change
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearch, urlSearch, searchParams, router, pathname]);

  // ── Effect 3: Fetch products ──────────────────────────────────────────────
  //
  // Runs when page, limit, urlSearch, or retryCount changes.
  //
  // STALE-REQUEST PROTECTION — two layers:
  //  1. AbortController: cancels the in-flight HTTP request via Axios signal.
  //     When the cleanup function runs (i.e. a new fetch supersedes the old),
  //     controller.abort() is called.  Axios translates this into a
  //     CanceledError, which isCancel() detects.
  //  2. `cancelled` flag: guards against the (unlikely) scenario where the
  //     then/catch callback fires after React has already cleaned up.
  //
  // Race-condition scenario:
  //   Request A (phone) starts → user changes to "laptop" → cleanup runs →
  //   A is aborted → B starts → B resolves → UI shows laptop results.
  //   Even if A were to resolve after B, isCancel(err) silences A's
  //   catch — and the `cancelled` flag in the then callback discards A's data.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    dispatch({ type: 'FETCH_START' });

    const skip = calcSkip(page, limit);
    const promise = urlSearch
      ? searchProducts(urlSearch, { limit, skip }, controller.signal)
      : getProducts({ limit, skip }, controller.signal);

    promise
      .then((data) => {
        if (!cancelled) {
          dispatch({
            type: 'FETCH_SUCCESS',
            products: data.products,
            total: data.total,
          });
        }
      })
      .catch((err: unknown) => {
        // isCancel() returns true when Axios aborts due to AbortController.
        // This is intentional control flow — do NOT show an error banner.
        if (isCancel(err)) return;

        // Any other error (network failure, API error) is a real problem.
        if (!cancelled) {
          dispatch({
            type: 'FETCH_ERROR',
            message: 'Failed to load products. Please check your connection and try again.',
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort(); // Cancel the in-flight request
    };
  }, [page, limit, urlSearch, retryCount]);

  // ── Effect 4: Correct page > totalPages after data arrives ───────────────
  //
  // Example: /products?page=999&limit=20&search=phone
  // The search may return fewer total results than the requested page implies.
  // After the fetch resolves, if page > totalPages, redirect to the last page.
  // Guard: only fires when status is success/empty AND page is truly > total —
  // avoids redirect loops (once corrected, page <= totalPages and it stops).
  useEffect(() => {
    if (status !== 'success' && status !== 'empty') return;
    if (total === 0) return; // genuinely empty — no redirect needed

    const totalPages = calcTotalPages(total, limit);
    if (page > totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(totalPages));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [status, total, page, limit, router, pathname, searchParams]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  //
  // Uses URLSearchParams(searchParams.toString()) so that ALL existing params
  // (search, and future: category, sort, order) are preserved automatically.
  // Only page and limit are modified.

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
    router.replace(`${pathname}?${buildParams(1, newLimit)}`);
  }

  // ── Clear search ──────────────────────────────────────────────────────────
  // Called from SearchInput's X button — an event handler, never in an effect.
  // setInputValue here is lint-safe (event handler, not inside useEffect).
  function handleClearSearch() {
    setInputValue(''); // clear the visible input immediately
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalPages = calcTotalPages(total, limit);

  const subtitle = status === 'success' ? getResultRange(page, limit, total) : '';

  const paginationProps = {
    currentPage:      page,
    totalPages,
    totalItems:       total,
    pageSize:         limit,
    onPageChange:     handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page heading */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
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

      {/* Filter bar — search input (category, sort will be added in later phases) */}
      <div className="mb-4 flex items-center gap-3">
        <SearchInput
          value={inputValue}
          onChange={setInputValue}
          onClear={handleClearSearch}
        />
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
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <ProductsTable products={[]} loading />
          </div>
          <div className="md:hidden">
            <CardSkeleton count={6} />
          </div>
        </>
      )}

      {/* ── Empty ───────────────────────────────────────────────────────── */}
      {status === 'empty' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <EmptyState
            icon={ShoppingBag}
            message={
              urlSearch
                ? `No products found for "${urlSearch}".`
                : 'No products found.'
            }
          />
          {urlSearch && (
            <div className="pb-6 text-center">
              <button
                type="button"
                id="products-clear-search-btn"
                onClick={handleClearSearch}
                className="text-sm text-indigo-600 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
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

          {/* Mobile: stacked cards + pagination card */}
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
