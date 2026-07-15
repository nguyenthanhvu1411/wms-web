import httpClient from './httpClient';
import type { 
  Product, Category, Uom, Supplier, Warehouse, Location,
  ProductBarcode, SupplierProduct, WarehouseSummary 
} from '@/types/masterData';
import type { ApiResponse, PaginatedData } from '@/types/common';

export const masterDataApi = {
  // ==========================================
  // CATEGORIES
  // ==========================================
  getCategories: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<Category>>>('/api/categories', { params });
    return res.data;
  },
  getCategoryById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<Category>>(`/api/categories/${id}`);
    return res.data;
  },
  createCategory: async (data: Partial<Category>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/categories', data);
    return res;
  },
  updateCategory: async (id: number, data: Partial<Category>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/categories/${id}`, data);
    return res;
  },
  deleteCategory: async (id: number) => {
    const res = await httpClient.delete<any, ApiResponse<boolean>>(`/api/categories/${id}`);
    return res;
  },
  activateCategory: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/categories/${id}/activate`);
    return res;
  },
  deactivateCategory: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/categories/${id}/deactivate`);
    return res;
  },

  // ==========================================
  // PRODUCTS
  // ==========================================
  getProductStatuses: async () => {
    const res = await httpClient.get<any, ApiResponse<Array<{ id: string, name: string }>>>('/api/system/enums/product-statuses');
    return res.data;
  },
  getProducts: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<Product>>>('/api/products', { params });
    return res.data;
  },
  exportProducts: async (params: any) => {
    const res = await httpClient.get<any, Blob>('/api/products/export', { params, responseType: 'blob' });
    return res;
  },
  downloadProductTemplate: async () => {
    const res = await httpClient.get<any, Blob>('/api/products/template', { responseType: 'blob' });
    return res;
  },
  importProducts: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await httpClient.post<any, ApiResponse<any>>('/api/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },
  getProductById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<Product>>(`/api/products/${id}`);
    return res.data;
  },
  createProduct: async (data: Partial<Product>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/products', data);
    return res;
  },
  updateProduct: async (id: number, data: Partial<Product>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/products/${id}`, data);
    return res;
  },
  activateProduct: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/products/${id}/activate`);
    return res;
  },
  discontinueProduct: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/products/${id}/discontinue`);
    return res;
  },
  getProductBarcodes: async (productId: number) => {
    const res = await httpClient.get<any, ApiResponse<ProductBarcode[]>>(`/api/products/${productId}/barcodes`);
    return res.data;
  },
  addProductBarcode: async (productId: number, data: Partial<ProductBarcode>) => {
    const res = await httpClient.post<any, ApiResponse<number>>(`/api/products/${productId}/barcodes`, data);
    return res;
  },
  updateProductBarcode: async (productId: number, barcodeId: number, data: Partial<ProductBarcode>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/products/${productId}/barcodes/${barcodeId}`, data);
    return res;
  },
  deleteProductBarcode: async (productId: number, barcodeId: number) => {
    const res = await httpClient.delete<any, ApiResponse<boolean>>(`/api/products/${productId}/barcodes/${barcodeId}`);
    return res;
  },
  uploadProductImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await httpClient.post<any, ApiResponse<string>>('/api/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res;
  },

  // ==========================================
  // UOMS
  // ==========================================
  getUoms: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<Uom>>>('/api/uoms', { params });
    return res.data;
  },
  getUomById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<Uom>>(`/api/uoms/${id}`);
    return res.data;
  },
  createUom: async (data: Partial<Uom>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/uoms', data);
    return res;
  },
  updateUom: async (id: number, data: Partial<Uom>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/uoms/${id}`, data);
    return res;
  },
  activateUom: async (id: number) => {
    const res = await httpClient.patch<any, ApiResponse<boolean>>(`/api/uoms/${id}/activate`);
    return res;
  },
  deactivateUom: async (id: number) => {
    const res = await httpClient.patch<any, ApiResponse<boolean>>(`/api/uoms/${id}/deactivate`);
    return res;
  },
  deleteUom: async (id: number) => {
    const res = await httpClient.delete<any, ApiResponse<boolean>>(`/api/uoms/${id}`);
    return res;
  },

  // ==========================================
  // SUPPLIERS
  // ==========================================
  getSuppliers: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<Supplier>>>('/api/suppliers', { params });
    return res.data;
  },
  getSupplierById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<Supplier>>(`/api/suppliers/${id}`);
    return res.data;
  },
  createSupplier: async (data: Partial<Supplier>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/suppliers', data);
    return res;
  },
  updateSupplier: async (id: number, data: Partial<Supplier>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/suppliers/${id}`, data);
    return res;
  },
  activateSupplier: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/suppliers/${id}/activate`);
    return res;
  },
  deactivateSupplier: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/suppliers/${id}/deactivate`);
    return res;
  },
  getSupplierProducts: async (id: number, params?: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<SupplierProduct>>>(`/api/suppliers/${id}/products`, { params });
    return res.data;
  },
  assignSupplierProduct: async (id: number, data: Partial<SupplierProduct>) => {
    const res = await httpClient.post<any, ApiResponse<number>>(`/api/suppliers/${id}/products`, data);
    return res;
  },
  updateSupplierProduct: async (id: number, supplierProductId: number, data: Partial<SupplierProduct>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/suppliers/${id}/products/${supplierProductId}`, data);
    return res;
  },
  deleteSupplierProduct: async (id: number, supplierProductId: number) => {
    const res = await httpClient.delete<any, ApiResponse<boolean>>(`/api/suppliers/${id}/products/${supplierProductId}`);
    return res;
  },

  // ==========================================
  // WAREHOUSES
  // ==========================================
  getWarehouses: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<Warehouse>>>('/api/warehouses', { params });
    return res.data;
  },
  getWarehouseById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<Warehouse>>(`/api/warehouses/${id}`);
    return res.data;
  },
  getWarehouseSummary: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<WarehouseSummary>>(`/api/warehouses/${id}/summary`);
    return res.data;
  },
  createWarehouse: async (data: Partial<Warehouse>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/warehouses', data);
    return res;
  },
  updateWarehouse: async (id: number, data: Partial<Warehouse>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/warehouses/${id}`, data);
    return res;
  },
  lockWarehouse: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/warehouses/${id}/lock`);
    return res;
  },
  unlockWarehouse: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/warehouses/${id}/unlock`);
    return res;
  },
  assignWarehouseManager: async (id: number, data: { managerId: number }) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/warehouses/${id}/manager`, data);
    return res;
  },

  // ==========================================
  // LOCATIONS
  // ==========================================
  getLocations: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<Location>>>('/api/locations', { params });
    return res.data;
  },
  getLocationById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<Location>>(`/api/locations/${id}`);
    return res.data;
  },
  getLocationLabel: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<any>>(`/api/locations/${id}/label`);
    return res.data;
  },
  createLocation: async (data: Partial<Location>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/locations', data);
    return res;
  },
  updateLocation: async (id: number, data: Partial<Location>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/locations/${id}`, data);
    return res;
  },
  lockLocation: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/locations/${id}/lock`);
    return res;
  },
  unlockLocation: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/locations/${id}/unlock`);
    return res;
  },
};
