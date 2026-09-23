/**
 * ProductSkeleton — animate-pulse placeholders for both views.
 *
 * TableSkeleton: renders N <tr> elements — drop inside a <tbody>.
 * CardSkeleton:  renders N card-shaped divs — drop directly in the page.
 */

// ---------------------------------------------------------------------------
// Desktop — skeleton table rows
// ---------------------------------------------------------------------------
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {/* Product */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse shrink-0" />
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
            </div>
          </td>
          {/* Category */}
          <td className="px-4 py-3">
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
          </td>
          {/* Price */}
          <td className="px-4 py-3">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </td>
          {/* Rating */}
          <td className="px-4 py-3">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </td>
          {/* Stock */}
          <td className="px-4 py-3">
            <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Mobile — skeleton cards
// ---------------------------------------------------------------------------
export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3"
        >
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse shrink-0" />

          <div className="flex-1 space-y-2 pt-1 min-w-0">
            {/* Title */}
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            {/* Category badge */}
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
            {/* Price + rating row */}
            <div className="flex items-center justify-between pt-1">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
            </div>
            {/* Stock badge */}
            <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
