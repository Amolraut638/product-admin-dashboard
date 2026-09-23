import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products — Product Admin',
};

/**
 * /products — product listing page.
 *
 * Phase 1: placeholder UI with correct heading structure.
 * Phase 2: will add filter bar, data table, pagination, sorting, and search.
 */
export default function ProductsPage() {
  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Browse, search and manage your product catalogue.
          </p>
        </div>

        {/* Add Product button — will be wired in Phase 2 */}
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          id="add-product-btn"
        >
          + Add Product
        </button>
      </div>

      {/* Placeholder content card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
        <p className="text-sm text-gray-400">
          Products will appear here.
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Data table, filtering, sorting and pagination coming in Phase 2.
        </p>
      </div>
    </div>
  );
}
