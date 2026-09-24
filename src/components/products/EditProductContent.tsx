'use client';

import { useReducer, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, RefreshCw } from 'lucide-react';
import { isCancel, isAxiosError } from 'axios';
import type { Product } from '@/types/product';
import { getProductById } from '@/services/product.service';
import { parseProductId } from '@/lib/utils';
import ProductForm from './ProductForm';

// ---------------------------------------------------------------------------
// Load state — useReducer so dispatch inside the fetch effect is lint-safe.
// ---------------------------------------------------------------------------
interface LoadState {
  status:   'loading' | 'success' | 'notFound' | 'error';
  product:  Product | null;
  errorMsg: string | null;
}

type LoadAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; product: Product }
  | { type: 'LOAD_NOT_FOUND' }
  | { type: 'LOAD_ERROR'; message: string };

function loadReducer(state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case 'LOAD_START':
      return { status: 'loading', product: null, errorMsg: null };
    case 'LOAD_SUCCESS':
      return { status: 'success', product: action.product, errorMsg: null };
    case 'LOAD_NOT_FOUND':
      return { status: 'notFound', product: null, errorMsg: null };
    case 'LOAD_ERROR':
      return { status: 'error', product: null, errorMsg: action.message };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Inline skeleton — mirrors the form layout without a separate file.
// ---------------------------------------------------------------------------
function EditFormSkeleton() {
  return (
    <div>
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse" />
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>
        {/* Price + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
        {/* Stock */}
        <div className="w-1/2 space-y-1.5">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditProductContent — client component for /products/[id]/edit
//
// Fetches the existing product by ID, then renders ProductForm in edit mode
// pre-populated with the loaded values.
//
// The parent page passes `key={id}` so each distinct product ID gets a fresh
// instance (clean state reset, no stale data between navigations).
// ---------------------------------------------------------------------------
interface EditProductContentProps {
  id: string;
}

export default function EditProductContent({ id }: EditProductContentProps) {
  const numericId = parseProductId(id);

  // If the ID is syntactically invalid, start directly in notFound.
  const [state, dispatch] = useReducer(
    loadReducer,
    numericId !== null
      ? { status: 'loading', product: null, errorMsg: null }
      : { status: 'notFound', product: null, errorMsg: null },
  );

  // retryCount is incremented in event handlers only — lint-safe.
  const [retryCount, setRetryCount] = useState(0);

  const { status, product, errorMsg } = state;

  // ── Fetch the existing product ─────────────────────────────────────────
  useEffect(() => {
    if (numericId === null) return; // invalid ID — already notFound

    let cancelled = false;
    const controller = new AbortController();

    dispatch({ type: 'LOAD_START' });

    getProductById(numericId, controller.signal)
      .then((data) => {
        if (!cancelled) dispatch({ type: 'LOAD_SUCCESS', product: data });
      })
      .catch((err: unknown) => {
        if (isCancel(err)) return;
        if (!cancelled) {
          if (isAxiosError(err) && err.response?.status === 404) {
            dispatch({ type: 'LOAD_NOT_FOUND' });
          } else {
            dispatch({
              type: 'LOAD_ERROR',
              message: 'Failed to load the product. Please check your connection.',
            });
          }
        }
      });

    return () => { cancelled = true; controller.abort(); };
  }, [numericId, retryCount]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (status === 'loading') return <EditFormSkeleton />;

  // ── Not found ────────────────────────────────────────────────────────
  if (status === 'notFound') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          {`"${id}"`} is not a valid product. It may have been removed or never existed.
        </p>
        <Link
          href="/products"
          id="edit-not-found-back"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
                     text-sm font-medium rounded-full hover:bg-indigo-700 transition"
        >
          <ArrowLeft size={15} />
          Back to Products
        </Link>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <p className="text-sm text-gray-600">{errorMsg ?? 'Something went wrong.'}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="edit-load-retry"
            onClick={() => setRetryCount((c) => c + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
                       text-sm font-medium rounded-full hover:bg-indigo-700 transition"
          >
            <RefreshCw size={14} />
            Retry
          </button>
          <Link
            href="/products"
            className="text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // ── Success — render form with pre-populated values ──────────────────
  if (status === 'success' && product) {
    return (
      <ProductForm
        mode="edit"
        productId={product.id}
        initialValues={{
          title:       product.title,
          description: product.description,
          price:       String(product.price),
          category:    product.category,
          stock:       String(product.stock),
        }}
      />
    );
  }

  return null;
}
