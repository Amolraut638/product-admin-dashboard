'use client';

import { useState } from 'react';
import { Star, ImageOff } from 'lucide-react';
import type { Product } from '@/types/product';
import Badge from '@/components/ui/Badge';
import StockBadge from './StockBadge';
import { formatPrice } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Card thumbnail — same graceful fallback as the desktop table
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
// ProductCard — a single product displayed as a mobile card
// ---------------------------------------------------------------------------
interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3">
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
    </div>
  );
}
