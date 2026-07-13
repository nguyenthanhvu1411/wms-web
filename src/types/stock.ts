export interface StockBalance {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseCode: string;
  locationId: number;
  locationCode: string;
  lotNumber?: string;
  expiryDate?: string;
  uomId: number;
  uomCode: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyInTransit: number;
  qtyOnHold: number;
  qtyQuarantined: number;
  qtyDamaged: number;
  qtyAvailable: number;
  averageCost: number;
  totalValue: number;
  minStockLevel: number;
  isLowStock: boolean;
}

export interface StockTransaction {
  id: number;
  transactionType: number;
  productId: number;
  productSku: string;
  warehouseId: number;
  warehouseCode: string;
  fromLocationId?: number;
  fromLocationCode?: string;
  toLocationId?: number;
  toLocationCode?: string;
  uomId: number;
  uomCode: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  unitCost: number;
  totalCost: number;
  lotNumber?: string;
  expiryDate?: string;
  referenceType: string;
  referenceId: number;
  notes?: string;
  createdBy?: string;
  transactionDate: string;
}

export interface ReconciliationQueryRequest {
  page?: number;
  pageSize?: number;
  warehouseId?: number;
  productId?: number;
  locationId?: number;
  lotNumber?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ReconciliationResponse {
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseCode: string;
  locationId: number;
  locationCode: string;
  uomName: string;
  lotNumber?: string;
  expiryDate?: string;
  systemQty: number;
  calculatedQty: number;
  differenceQty: number;
  inboundQty: number;
  outboundQty: number;
}
