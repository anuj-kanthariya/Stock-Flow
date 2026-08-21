import api from '../axios';
import type { Product, PaginatedResponse } from '@/types';

// Get base URL without the /api/v1 prefix
const getBackendHost = () => {
  const baseURL = (import.meta as any).env.VITE_API_URL || '/api/v1';
  return baseURL.replace(/\/api\/v1\/?$/, '');
};

// Map snake_case to camelCase
const mapProduct = (data: any): Product => {
  let formattedImageUrl = data.image_url;
  if (formattedImageUrl && formattedImageUrl.startsWith('/uploads')) {
    formattedImageUrl = `${getBackendHost()}${formattedImageUrl}`;
  }

  return {
    id: data.id,
    name: data.name,
    sku: data.sku,
    barcode: data.barcode,
    categoryId: data.category_id,
    categoryName: data.category_name,
    description: data.description,
    purchasePrice: data.purchase_price,
    sellingPrice: data.selling_price,
    gstPercentage: data.gst_percentage,
    stockQuantity: data.stock_quantity,
    minimumStock: data.minimum_stock,
    unit: data.unit,
    brand: data.brand,
    imageUrl: formattedImageUrl,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const getProducts = async (
  page: number = 1,
  limit: number = 20,
  search: string = '',
  categoryId: string = 'all',
  sortBy: string = 'name'
): Promise<PaginatedResponse<Product>> => {
  const params: any = { page, limit };
  if (search) params.search = search;
  if (categoryId && categoryId !== 'all') params.category_id = categoryId;
  if (sortBy) params.sort_by = sortBy;

  const response = await api.get('/products/', { params });
  return {
    data: response.data.data.map(mapProduct),
    meta: {
      page: response.data.meta.page,
      limit: response.data.meta.limit,
      total: response.data.meta.total,
      totalPages: response.data.meta.total_pages,
    },
  };
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return mapProduct(response.data);
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  const response = await api.post('/products/', {
    name: data.name,
    sku: data.sku,
    barcode: data.barcode || null,
    category_id: data.categoryId,
    description: data.description || null,
    purchase_price: data.purchasePrice,
    selling_price: data.sellingPrice,
    gst_percentage: data.gstPercentage,
    stock_quantity: data.stockQuantity,
    minimum_stock: data.minimumStock,
    unit: data.unit,
    brand: data.brand || null,
    image_url: data.imageUrl || null,
  });
  return mapProduct(response.data);
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.sku !== undefined) payload.sku = data.sku;
  if (data.barcode !== undefined) payload.barcode = data.barcode || null;
  if (data.categoryId !== undefined) payload.category_id = data.categoryId;
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.purchasePrice !== undefined) payload.purchase_price = data.purchasePrice;
  if (data.sellingPrice !== undefined) payload.selling_price = data.sellingPrice;
  if (data.gstPercentage !== undefined) payload.gst_percentage = data.gstPercentage;
  if (data.stockQuantity !== undefined) payload.stock_quantity = data.stockQuantity;
  if (data.minimumStock !== undefined) payload.minimum_stock = data.minimumStock;
  if (data.unit !== undefined) payload.unit = data.unit;
  if (data.brand !== undefined) payload.brand = data.brand || null;
  if (data.imageUrl !== undefined) payload.image_url = data.imageUrl || null;
  if (data.isActive !== undefined) payload.is_active = data.isActive;

  const response = await api.patch(`/products/${id}`, payload);
  return mapProduct(response.data);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const uploadProductImage = async (id: string, file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/products/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return { imageUrl: response.data.image_url };
};


export interface ProductImportRow {
  row_number: number;
  name: string;
  sku: string | null;
  category: string;
  selling_price: number;
  cost_price: number | null;
  stock: number;
  unit: string;
  status: string;
  errors: string[];
}

export interface ProductImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  new_categories: number;
  rows: ProductImportRow[];
}

export interface ProductImportExecuteResponse {
  products_imported: number;
  categories_created: number;
  products_skipped: number;
  products_failed: number;
}

export const downloadImportTemplate = async (): Promise<Blob> => {
  const response = await api.get('/products/import/template', {
    responseType: 'blob',
  });
  return response.data;
};

export const uploadExcelPreview = async (file: File): Promise<ProductImportPreviewResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/products/import/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const executeExcelImport = async (rows: ProductImportRow[]): Promise<ProductImportExecuteResponse> => {
  const response = await api.post('/products/import/execute', { rows });
  return response.data;
};
