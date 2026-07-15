export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  categoryName: string;
  uomId: number;
  uomCode: string;
  uomName?: string;
  defaultBarcode?: string;
  brand?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  costPrice: number;
  salePrice: number;
  stockPolicy: number | string;
  trackSerialNumber: boolean;
  trackLot: boolean;
  trackExpiry: boolean;
  shelfLifeDays?: number;
  expiryWarningDays?: number;
  minStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  weightKg: number;
  volumeM3: number;
  requiresQualityInspection: boolean;
  isPurchasable: boolean;
  isSellable: boolean;
  status: number | string;
  barcodes?: ProductBarcode[];
}

export interface Category {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  parentName?: string;
  level: number;
  sortOrder: number;
  productCount: number;
  isActive: boolean;
  iconUrl?: string;
  description?: string;
}

export interface Uom {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  baseUomId?: number;
  baseUomCode?: string;
  baseUomName?: string;
  conversionFactor: number;
  isActive: boolean;
  notes?: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTermsDays: number;
  currency: string;
  creditLimit: number;
  rating: number;
  purchaseOrderCount: number;
  supplierProductCount: number;
  isActive: boolean;
  notes?: string;
  bankAccount?: string;
  bankName?: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  type: number | string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  managerId?: number;
  managerName?: string;
  totalAreaM2: number;
  locationCount: number;
  totalStockQuantity: number;
  isActive: boolean;
  notes?: string;
}

export interface Location {
  id: number;
  code: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  type: number | string;
  status: number | string;
  maxVolumeM3: number;
  maxWeightKg: number;
  currentWeightKg: number;
  qtyOnHand: number;
  isOccupied: boolean;
  allowMixedProducts: boolean;
  allowMixedLots: boolean;
  barcodeLabel?: string;
  notes?: string;
}

// ----------------------------------------------------------------------
// RELATED ENTITIES
// ----------------------------------------------------------------------
export interface ProductBarcode {
  id: number;
  barcode: string;
  uomId: number;
  uomName?: string;
  qtyPerUom: number;
  isDefault: boolean;
  description?: string;
  isActive: boolean;
}

export interface SupplierProduct {
  id: number;
  supplierId: number;
  productId: number;
  productName?: string;
  supplierSku?: string;
  lastPurchasePrice: number;
  leadTimeDays: number;
  isPreferred: boolean;
  notes?: string;
  isActive: boolean;
}

export interface WarehouseSummary {
  id: number;
  code: string;
  name: string;
  totalLocations: number;
  activeLocations: number;
  lockedLocations: number;
  totalStockQuantity: number;
  totalInventoryValue?: number;
}
