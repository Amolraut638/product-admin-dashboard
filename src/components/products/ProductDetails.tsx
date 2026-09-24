'use client';

import { useReducer, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Package, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { isCancel, isAxiosError } from 'axios';
import type { Product } from '@/types/product';
import { getProductById, deleteProduct } from '@/services/product.service';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ProductImageGallery from './ProductImageGallery';
import ProductReviews from './ProductReviews';
import Badge from '@/components/ui/Badge';
import StockBadge from './StockBadge';
import { formatPrice, parseProductId } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Fetch state — useReducer for atomic transitions (lint-safe in effects).
// ---------------------------------------------------------------------------
interface DetailState {
  status: 'loading' | 'success' | 'notFound' | 'error';
  product: Product | null;
  errorMessage: string | null;
}

type DetailAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; product: Product }
  | { type: 'FETCH_NOT_FOUND' }
  | { type: 'FETCH_ERROR'; message: string };

function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', product: null, errorMessage: null };
    case 'FETCH_SUCCESS':
      return { status: 'success', product: action.product, errorMessage: null };
    case 'FETCH_NOT_FOUND':
      return { status: 'notFound', product: null, errorMessage: null };
    case 'FETCH_ERROR':
      return { status: 'error', product: null, errorMessage: action.message };
    default:
      return state;
  }
}

// parseProductId is imported from @/lib/utils (shared with edit page)

// ---------------------------------------------------------------------------
// ProductInfo — the right column: title, price, badges, description, metadata
// ---------------------------------------------------------------------------
function ProductInfo({ product }: { product: Product }) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.title}</h1>

      {/* Category + brand */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="indigo" className="capitalize">{product.category}</Badge>
        {product.brand && (
          <Badge variant="default">{product.brand}</Badge>
        )}
      </div>

      {/* Price */}
      <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>

      {/* Rating + stock side-by-side */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-sm text-gray-600">
          <Star size={15} className="text-amber-400 fill-amber-400" aria-hidden="true" />
          <span className="font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-gray-400">/ 5</span>
        </span>
        <StockBadge stock={product.stock} />
      </div>

      {/* Description */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <MetaItem label="SKU"          value={product.sku} />
        <MetaItem label="Weight"       value={`${product.weight} kg`} />
        <MetaItem label="Warranty"     value={product.warrantyInformation} />
        <MetaItem label="Shipping"     value={product.shippingInformation} />
        <MetaItem label="Return"       value={product.returnPolicy} />
        <MetaItem label="Min. Order"   value={String(product.minimumOrderQuantity)} />
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotFound — shown for invalid IDs or 404 responses
// ---------------------------------------------------------------------------
function NotFound({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Package size={48} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        {`"${id}"`} is not a valid product. It may have been removed or the ID is incorrect.
      </p>
      <Link
        href="/products"
        id="product-not-found-back"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm
                   font-medium rounded-full hover:bg-indigo-700 transition"
      >
        <ArrowLeft size={15} />
        Back to Products
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductDetails — client component
//
// Receives `id` (the raw URL string) from the Server Component page.
// The page wraps this with <Suspense key={id}>, so each distinct product ID
// gets a fresh component instance (clean state reset between navigations).
//
// Validation flow:
//   parseProductId('abc')  → null → initial status: 'notFound' (no fetch)
//   parseProductId('999999') → 999999 → initial status: 'loading' → fetch → 404 → 'notFound'
//   parseProductId('1')    → 1     → initial status: 'loading' → fetch → 'success'
// ---------------------------------------------------------------------------
interface ProductDetailsProps {
  id: string;
}

export default function ProductDetails({ id }: ProductDetailsProps) {
  const numericId = parseProductId(id);

  // If the ID is syntactically invalid, start in notFound so no fetch occurs.
  const [state, dispatch] = useReducer(
    detailReducer,
    numericId !== null
      ? { status: 'loading', product: null, errorMessage: null }
      : { status: 'notFound', product: null, errorMessage: null },
  );

  // retryCount: incremented in the Retry button handler (event handler, not effect).
  const [retryCount, setRetryCount] = useState(0);

  // ── Delete state ───────────────────────────────────────────────────
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting,        setIsDeleting]        = useState(false);
  const [deleteError,       setDeleteError]       = useState<string | null>(null);

  const { status, product, errorMessage } = state;

  // ── Delete handler ───────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!product || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(product.id);
      router.push('/products');
    } catch {
      setDeleteError('Failed to delete the product. Please try again.');
      setIsDeleting(false);
    }
  }

  // ── Fetch effect ───────────────────────────────────────────────────────
  //
  // Skips the fetch entirely for invalid IDs.
  // Distinguishes 404 ("product does not exist") from other errors ("network failure").
  // AbortController + cancelled flag prevent stale responses on unmount.
  useEffect(() => {
    if (numericId === null) return; // invalid ID — already set to notFound

    let cancelled = false;
    const controller = new AbortController();

    dispatch({ type: 'FETCH_START' });

    getProductById(numericId, controller.signal)
      .then((data) => {
        if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', product: data });
      })
      .catch((err: unknown) => {
        if (isCancel(err)) return; // intentional abort — ignore silently
        if (!cancelled) {
          if (isAxiosError(err) && err.response?.status === 404) {
            dispatch({ type: 'FETCH_NOT_FOUND' });
          } else {
            dispatch({
              type: 'FETCH_ERROR',
              message: 'Failed to load product details. Please check your connection.',
            });
          }
        }
      });

    return () => { cancelled = true; controller.abort(); };
  }, [numericId, retryCount]); // numericId is stable for a given id string

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Top nav — back link + edit button */}
      {status !== 'loading' && (
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            id="product-detail-back"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500
                       hover:text-indigo-600 transition"
          >
            <ArrowLeft size={15} />
            Back to Products
          </Link>

          {/* Only show Edit + Delete when a product is loaded */}
          {status === 'success' && product && (
            <div className="flex items-center gap-2">
              <Link
                href={`/products/${product.id}/edit`}
                id="product-detail-edit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm
                           font-medium border border-gray-300 text-gray-600
                           hover:bg-gray-50 transition"
              >
                <Pencil size={14} />
                Edit
              </Link>

              <button
                type="button"
                id="product-detail-delete"
                onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm
                           font-medium border border-red-200 text-red-600
                           hover:bg-red-50 transition"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image placeholder */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Info placeholder */}
          <div className="space-y-4 pt-2">
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2 mt-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* ── Not found ───────────────────────────────────────────────── */}
      {status === 'notFound' && <NotFound id={id} />}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-sm text-gray-600">
            {errorMessage ?? 'Something went wrong.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="product-detail-retry"
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
      )}

      {/* ── Success ─────────────────────────────────────────────────── */}
      {status === 'success' && product && (
        <>
          {/* Two-column layout on desktop, single-column on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left — image gallery */}
            <ProductImageGallery
              images={product.images}
              thumbnail={product.thumbnail}
              title={product.title}
            />

            {/* Right — product info */}
            <ProductInfo product={product} />
          </div>

          {/* Reviews — full width below */}
          <ProductReviews reviews={product.reviews ?? []} />
        </>
      )}

    {/* ── Delete confirmation dialog ──────────────────────────────── */}
    <ConfirmDialog
      open={showDeleteConfirm}
      title="Delete Product?"
      description={
        product
          ? `Are you sure you want to delete "${product.title}"? This action cannot be undone.`
          : ''
      }
      confirmLabel="Delete"
      loading={isDeleting}
      error={deleteError}
      onCancel={() => { if (!isDeleting) { setShowDeleteConfirm(false); setDeleteError(null); } }}
      onConfirm={handleDeleteConfirm}
    />
  </>
  );
}
