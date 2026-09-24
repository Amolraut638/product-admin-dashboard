import ProductForm from '@/components/products/ProductForm';

/**
 * /products/new — Add a new product.
 *
 * Server Component — no async work needed; just renders the client form.
 * Protected by the (dashboard) route group layout (auth redirect on load).
 */
export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
