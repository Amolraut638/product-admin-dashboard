'use client';

import { useReducer, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { isCancel } from 'axios';
import type { Product } from '@/types/product';
import { getProducts, searchProducts, getCategoryProducts, deleteProduct } from '@/services/product.service';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories } from '@/hooks/useCategories';
import {
  parsePage,
  parseLimit,
  calcSkip,
  calcTotalPages,
  getResultRange,
} from '@/lib/pagination';
import type { PageSize } from '@/lib/pagination';
import {
  parseSortField,
  parseSortOrder,
} from '@/lib/filters';
import type { SortField, SortOrder } from '@/lib/filters';
import ProductsTable from './ProductsTable';
import ProductCard from './ProductCard';
import FilterBar from './FilterBar';
import { CardSkeleton } from './ProductSkeleton';
import Pagination from '@/components/table/Pagination';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Fetch state — useReducer keeps state transitions atomic.
// dispatch() is NOT flagged by react-hooks/set-state-in-effect (only useState
// setters are flagged when called synchronously inside an effect body).
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
  | { type: 'FETCH_ERROR'; message: string }
  | { type: 'DELETE_PRODUCT'; id: number };

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
    case 'DELETE_PRODUCT': {
      const filtered = state.products.filter((p) => p.id !== action.id);
      const newTotal = Math.max(0, state.total - 1);
      return {
        ...state,
        products: filtered,
        total:    newTotal,
        status:   filtered.length === 0 ? 'empty' : 'success',
      };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// ProductsContent
//
// Must live inside a <Suspense> boundary (products/page.tsx) because it
// calls useSearchParams() — a Next.js App Router requirement.
// ---------------------------------------------------------------------------
export default function ProductsContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // ── URL as single source of truth ─────────────────────────────────────
  const page         = parsePage(searchParams.get('page'));
  const limit        = parseLimit(searchParams.get('limit'));
  const urlSearch    = searchParams.get('search')   ?? '';
  const urlCategory  = searchParams.get('category') ?? '';
  const urlSort      = parseSortField(searchParams.get('sort'));    // SortField | ''
  const urlOrder     = parseSortOrder(searchParams.get('order'));   // SortOrder ('asc' default)

  // ── Local controlled state ─────────────────────────────────────────────
  // inputValue drives the visible search box — initialised from URL on mount
  // so that a direct URL like /products?search=phone pre-fills the input.
  // setInputValue is called only from event handlers (never inside effects).
  const [inputValue, setInputValue] = useState(urlSearch);

  // Debounced copy: only settles 450 ms after the last keystroke.
  // setState inside useDebounce runs inside setTimeout (async), so the
  // react-hooks/set-state-in-effect rule is NOT triggered.
  const debouncedSearch = useDebounce(inputValue, 450);

  // retryCount incremented by event handlers only — never inside useEffect.
  const [retryCount, setRetryCount] = useState(0);

  // Fetch state
  const [fetchState, dispatch] = useReducer(fetchReducer, initialFetchState);
  const { status, products, total, errorMessage } = fetchState;

  // ── Delete state ──────────────────────────────────────────────────────
  // pendingDelete: the product the user clicked Delete on (null = dialog closed)
  // deletingId:    id currently being deleted (null = no deletion in-flight)
  // deleteError:   message shown inside the dialog when the DELETE request fails
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deletingId,    setDeletingId]    = useState<number | null>(null);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // Categories — loaded once on mount by the useCategories hook.
  const {
    categories,
    loading: categoriesLoading,
    error:   categoriesError,
  } = useCategories();

  // ── Effect 1: Normalize invalid URL params ────────────────────────────
  //
  // Compares raw URL strings to their parsed (valid) representations.
  // If anything is invalid, replaces the URL ONCE — no loop because after
  // the replace the raw value === parsed value and the guard short-circuits.
  //
  // Handles: page, limit, sort, order.
  // Category is NOT validated here because validity depends on the category
  // list (fetched async); an unknown category simply returns empty results.
  useEffect(() => {
    const rawPage  = searchParams.get('page')  ?? '';
    const rawLimit = searchParams.get('limit') ?? '';
    const rawSort  = searchParams.get('sort')  ?? '';
    const rawOrder = searchParams.get('order') ?? '';

    const normPage  = String(parsePage(rawPage   || null));
    const normLimit = String(parseLimit(rawLimit || null));
    const normSort  = parseSortField(rawSort || null);  // '' if invalid/absent
    // order only matters when sort is set
    const normOrder: SortOrder | '' = normSort ? parseSortOrder(rawOrder || null) : '';

    const needsNorm =
      rawPage  !== normPage  ||
      rawLimit !== normLimit ||
      rawSort  !== normSort  ||                                 // invalid sort removed
      (normSort !== '' && rawOrder !== normOrder);              // invalid order corrected

    if (needsNorm) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page',  normPage);
      params.set('limit', normLimit);
      if (normSort) {
        params.set('sort',  normSort);
        params.set('order', normOrder);
      } else {
        params.delete('sort');
        params.delete('order');
      }
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, router, pathname]);

  // ── Effect 2: Sync debounced input → URL ─────────────────────────────
  //
  // Runs after the 450 ms debounce period with no new keystrokes.
  // Only updates the URL when the debounced value differs from the URL.
  //
  // Key behaviours:
  //  • Page is always reset to 1 when search changes.
  //  • router.replace (not setState) → lint-safe.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();

    // Guard: if debouncedSearch hasn't caught up to inputValue yet (e.g. the
    // input was programmatically cleared by handleClearSearch or
    // handleCategoryChange but the debounce timer is still pending), do nothing.
    // Without this guard, a stale debouncedSearch could re-add a deleted search
    // param to the URL before the debounce timer fires with the empty value.
    if (trimmed !== inputValue.trim()) return;

    if (trimmed === urlSearch) return; // already in sync — no-op

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearch, inputValue, urlSearch, searchParams, router, pathname]);

  // ── Effect 3: Fetch products ──────────────────────────────────────────
  //
  // Priority:  search > category > all products
  //
  // STALE-REQUEST PROTECTION — two layers:
  //  1. AbortController: controller.abort() is called in the cleanup function
  //     whenever a new fetch supersedes this one.  Axios translates abort
  //     into CanceledError; isCancel() detects it and returns early.
  //  2. `cancelled` boolean: discards results if the component unmounted
  //     (belt-and-suspenders in case the response arrives after cleanup).
  //
  // Sort params: the URL uses `sort`/`order`; the API uses `sortBy`/`order`.
  // Translation: { sortBy: urlSort, order: urlOrder } — built only when sort
  // is selected (urlSort !== '').
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    dispatch({ type: 'FETCH_START' });

    const skip      = calcSkip(page, limit);
    const sortParams = urlSort ? { sortBy: urlSort, order: urlOrder } : {};

    let promise;
    if (urlSearch) {
      // Phase 5 — search endpoint (DummyJSON also supports sortBy/order here)
      promise = searchProducts(urlSearch, { limit, skip, ...sortParams }, controller.signal);
    } else if (urlCategory) {
      // Phase 6 — category endpoint
      promise = getCategoryProducts(urlCategory, { limit, skip, ...sortParams }, controller.signal);
    } else {
      // Default — all products
      promise = getProducts({ limit, skip, ...sortParams }, controller.signal);
    }

    promise
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'FETCH_SUCCESS', products: data.products, total: data.total });
        }
      })
      .catch((err: unknown) => {
        // AbortController cancellation — intentional, never show an error.
        if (isCancel(err)) return;
        if (!cancelled) {
          dispatch({
            type: 'FETCH_ERROR',
            message: 'Failed to load products. Please check your connection and try again.',
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, limit, urlSearch, urlCategory, urlSort, urlOrder, retryCount]);

  // ── Effect 4: Correct page > totalPages after data arrives ───────────
  //
  // Example: ?page=999&limit=20&category=beauty — beauty may have only 5 pages.
  // After the fetch resolves, redirect to the last valid page.
  // Guard: stops once page <= totalPages — no redirect loop.
  useEffect(() => {
    if (status !== 'success' && status !== 'empty') return;
    if (total === 0) return;

    const totalPages = calcTotalPages(total, limit);
    if (page > totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(totalPages));
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [status, total, page, limit, router, pathname, searchParams]);

  // ── Navigation helpers ────────────────────────────────────────────────
  //
  // Always build on top of the full existing searchParams string so that
  // all active params (search, category, sort, order) are preserved when
  // only page or limit is changing.

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

  // ── Clear search ──────────────────────────────────────────────────────
  // Event handler → setInputValue is lint-safe here.
  function handleClearSearch() {
    setInputValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }

  // ── Category change ───────────────────────────────────────────────────
  // Selecting a category clears search (DummyJSON has no combined endpoint).
  // setInputValue is called from an event handler → lint-safe.
  function handleCategoryChange(newCategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory) {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }
    params.delete('search'); // mutually exclusive with search
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
    setInputValue(''); // clear visible input immediately
  }

  // ── Sort change ───────────────────────────────────────────────────────
  // Preserves category/search; resets page to 1.
  function handleSortChange(newSort: SortField | '', newOrder: SortOrder) {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort) {
      params.set('sort',  newSort);
      params.set('order', newOrder);
    } else {
      params.delete('sort');
      params.delete('order');
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }

  // ── Delete handlers ───────────────────────────────────────────────────

  // Open the confirmation dialog for a product.
  function handleDeleteRequest(product: Product) {
    setPendingDelete(product);
    setDeleteError(null);
  }

  // Cancel: close the dialog (blocked while a deletion is in-flight).
  function handleDeleteCancel() {
    if (deletingId !== null) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  // Confirm: call the API, update local state on success.
  // All setState calls are inside an async event handler — lint-safe.
  async function handleDeleteConfirm() {
    if (!pendingDelete || deletingId !== null) return; // prevent duplicates

    const id           = pendingDelete.id;
    // Capture product count before the async gap for empty-page navigation.
    const isLastOnPage = products.length === 1;

    setDeletingId(id);
    setDeleteError(null);

    try {
      await deleteProduct(id);

      // Remove from client-side list. Do NOT refetch — DummyJSON doesn't persist
      // deletions so a refetch would show the product again.
      dispatch({ type: 'DELETE_PRODUCT', id });
      setPendingDelete(null);
      setDeletingId(null);

      // If the page is now empty and there is a previous page, go back one page.
      if (isLastOnPage && page > 1) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page - 1));
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch {
      setDeleteError('Failed to delete the product. Please try again.');
      setDeletingId(null);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────

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

  // ── Empty-state message ───────────────────────────────────────────────
  function emptyMessage(): string {
    if (urlSearch)    return `No products found for "${urlSearch}".`;
    if (urlCategory)  return `No products found in this category.`;
    return 'No products found.';
  }

  // ── Render ────────────────────────────────────────────────────────────
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
        <Link
          href="/products/new"
          id="add-product-btn"
          className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2 rounded-full
                     text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700
                     active:bg-indigo-800 transition"
        >
          + Add Product
        </Link>
      </div>

      {/* Filter bar — search + category + sort */}
      <FilterBar
        searchValue={inputValue}
        onSearchChange={setInputValue}
        onSearchClear={handleClearSearch}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        selectedCategory={urlCategory}
        onCategoryChange={handleCategoryChange}
        selectedSort={urlSort}
        selectedOrder={urlOrder}
        onSortChange={handleSortChange}
        isSearchActive={urlSearch !== ''}
      />

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

      {/* ── Loading ─────────────────────────────────────────────────── */}
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

      {/* ── Empty ───────────────────────────────────────────────────── */}
      {status === 'empty' && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <EmptyState icon={ShoppingBag} message={emptyMessage()} />
          {(urlSearch || urlCategory) && (
            <div className="pb-6 text-center space-x-4">
              {urlSearch && (
                <button
                  type="button"
                  id="products-clear-search-btn"
                  onClick={handleClearSearch}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Clear search
                </button>
              )}
              {urlCategory && (
                <button
                  type="button"
                  id="products-clear-category-btn"
                  onClick={() => handleCategoryChange('')}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Show all categories
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Success ─────────────────────────────────────────────────── */}
      {status === 'success' && (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <ProductsTable products={products} onDelete={handleDeleteRequest} />
            <div className="border-t border-gray-100">
              <Pagination {...paginationProps} />
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <Pagination {...paginationProps} />
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirmation dialog ──────────────────────────────── */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Product?"
        description={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deletingId !== null}
        error={deleteError}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
