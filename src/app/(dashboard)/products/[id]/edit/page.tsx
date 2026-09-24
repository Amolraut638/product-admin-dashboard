import EditProductContent from '@/components/products/EditProductContent';

/**
 * /products/[id]/edit — Edit an existing product.
 *
 * Async Server Component — awaits `params` (Next.js 15+ App Router pattern).
 * Passes `id` to EditProductContent which:
 *   1. Validates the ID (not-found for invalid strings)
 *   2. Fetches the existing product
 *   3. Shows a skeleton while loading
 *   4. Renders ProductForm in edit mode with pre-populated values
 *
 * `key={id}` forces a clean remount of EditProductContent for each product,
 * resetting all fetch and form state without manual effects.
 *
 * Authentication: protected by the (dashboard) route group layout.
 */

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return <EditProductContent key={id} id={id} />;
}
