/**
 * ProductSkeleton — animate-pulse placeholders.
 *
 * TableSkeleton:        N <tr> elements — drop inside a <tbody>.
 * CardSkeleton:         N card-shaped divs — drop directly in the page.
 * ProductDetailSkeleton: full-page skeleton for the details route.
 */

// ---------------------------------------------------------------------------
// Desktop — skeleton table rows
// ---------------------------------------------------------------------------
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse shrink-0" />
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </td>
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
          <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 pt-1 min-w-0">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product detail page skeleton
// ---------------------------------------------------------------------------
export function ProductDetailSkeleton() {
  return (
    <div>
      {/* Back link */}
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left — image block */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Right — info block */}
        <div className="space-y-4 pt-2">
          <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2 mt-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Reviews skeleton */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
