// Phase 1: file established — full implementation in Phase 2
import apiClient from '@/lib/axios';
import type { Product, ProductFormData, ProductsQuery, ProductsResponse } from '@/types/product';

// GET /products  (with optional search, category, sort, pagination)
export async function getProducts(query: ProductsQuery = {}): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>('/products', { params: query });
  return response.data;
}

// GET /products/search?q=…
export async function searchProducts(q: string, query: Omit<ProductsQuery, 'q'> = {}): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>('/products/search', {
    params: { q, ...query },
  });
  return response.data;
}

// GET /products/:id
export async function getProductById(id: number): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${id}`);
  return response.data;
}

// GET /products/categories
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
