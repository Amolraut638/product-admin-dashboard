import apiClient from '@/lib/axios';
import type { Product, ProductFormData, ProductsQuery, ProductsResponse } from '@/types/product';

// GET /products  (all products with optional sort/pagination)
export async function getProducts(
  query: ProductsQuery = {},
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>('/products', {
    params: query,
    signal,
  });
  return response.data;
}

// GET /products/search?q=…  (search with optional sort/pagination)
export async function searchProducts(
  q: string,
  query: Omit<ProductsQuery, 'q'> = {},
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>('/products/search', {
    params: { q, ...query },
    signal,
  });
  return response.data;
}

// GET /products/category/{category}  (category filter with optional sort/pagination)
export async function getCategoryProducts(
  category: string,
  query: Omit<ProductsQuery, 'q'> = {},
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>(
    `/products/category/${encodeURIComponent(category)}`,
    { params: query, signal },
  );
  return response.data;
}

// GET /products/:id
export async function getProductById(id: number): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${id}`);
  return response.data;
}

// GET /products/category-list
export async function getCategories(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/products/category-list');
  return response.data;
}

// POST /products/add
export async function createProduct(data: ProductFormData): Promise<Product> {
  const response = await apiClient.post<Product>('/products/add', data);
  return response.data;
}

// PUT /products/:id
export async function updateProduct(id: number, data: Partial<ProductFormData>): Promise<Product> {
  const response = await apiClient.put<Product>(`/products/${id}`, data);
  return response.data;
}

// DELETE /products/:id
export async function deleteProduct(id: number): Promise<{ isDeleted: boolean; deletedOn: string }> {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
}
