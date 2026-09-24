'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ImageOff } from 'lucide-react';
import type { Product } from '@/types/product';
import Badge from '@/components/ui/Badge';
import StockBadge from './StockBadge';
import { TableSkeleton } from './ProductSkeleton';
import { formatPrice } from '@/lib/utils';

// ---------------------------------------------------------------------------
// ProductImage — thumbnail with graceful fallback on load error
// ---------------------------------------------------------------------------
function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
      {failed ? (
        <ImageOff size={16} className="text-gray-300" />
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
// ProductRow — single table row; title is a Link to the details page.
// The whole row has a group-hover so the bg shifts when hovered.
// ---------------------------------------------------------------------------
function ProductRow({ product }: { product: Product }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Product: thumbnail + clickable title */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <ProductImage src={product.thumbnail} alt={product.title} />
          <Link
            href={`/products/${product.id}`}
            id={`product-row-${product.id}`}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors
                       max-w-[220px] truncate block"
          >
            {product.title}
          </Link>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <Badge variant="indigo" className="capitalize">
          {product.category}
        </Badge>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-sm font-medium text-gray-700">
        {formatPrice(product.price)}
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-sm text-gray-600">
          <Star size={13} className="text-amber-400 fill-amber-400" aria-hidden="true" />
          {product.rating.toFixed(1)}
        </span>
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        <StockBadge stock={product.stock} />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// TableHead
// ---------------------------------------------------------------------------
function TableHead() {
  const cols = ['Product', 'Category', 'Price', 'Rating', 'Stock'];
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-100">
        {cols.map((col) => (
          <th
            key={col}
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ---------------------------------------------------------------------------
// ProductsTable — desktop-only table (hidden on mobile, shown at md+).
// Does NOT include a Card wrapper — parent wraps it together with Pagination.
// ---------------------------------------------------------------------------
interface ProductsTableProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductsTable({ products, loading = false }: ProductsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <TableHead />
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <TableSkeleton rows={8} />
          ) : (
            products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
