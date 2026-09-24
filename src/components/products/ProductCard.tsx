'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ImageOff, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/types/product';
import Badge from '@/components/ui/Badge';
import StockBadge from './StockBadge';
import { formatPrice } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Card thumbnail — graceful fallback on load error
// ---------------------------------------------------------------------------
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
      {failed ? (
        <ImageOff size={20} className="text-gray-300" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductCard — mobile card.
//
// Restructured from a single <Link> wrapper to a <div> so that the Edit
// link and Delete button in the footer are not nested inside an <a> element
// (which is invalid HTML and breaks keyboard/click events in most browsers).
//
// The clickable title area still navigates to the details page.
// ---------------------------------------------------------------------------
interface ProductCardProps {
  product:   Product;
  /** Called when the user clicks Delete — parent owns confirmation state. */
  onDelete?: (product: Product) => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden
                    hover:border-indigo-300 hover:shadow-sm transition-all">
      {/* Main content area — navigates to details page when clicked */}
      <Link
        href={`/products/${product.id}`}
        id={`product-card-${product.id}`}
        className="flex gap-3 p-4 hover:bg-gray-50 transition"
      >
        <CardImage src={product.thumbnail} alt={product.title} />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-semibold text-gray-900 truncate">
            {product.title}
          </p>

          {/* Category badge */}
          <div className="mt-1">
            <Badge variant="indigo" className="capitalize">
              {product.category}
            </Badge>
          </div>

          {/* Price + rating */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Star size={12} className="text-amber-400 fill-amber-400" aria-hidden="true" />
              {product.rating.toFixed(1)}
            </span>
          </div>

          {/* Stock */}
          <div className="mt-1.5">
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </Link>

      {/* Card footer — Edit + Delete actions (separate from the Link above) */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-end gap-2">
        <Link
          href={`/products/${product.id}/edit`}
          id={`card-edit-${product.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs
                     font-medium bg-gray-100 text-gray-700
                     hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          <Pencil size={11} />
          Edit
        </Link>

        <button
          type="button"
          id={`card-delete-${product.id}`}
          onClick={() => onDelete?.(product)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs
                     font-medium bg-red-50 text-red-600
                     hover:bg-red-100 hover:text-red-700 transition"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    </div>
  );
}
