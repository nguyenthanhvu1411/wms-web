export interface SalesOrderLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  uomId: number;
  uomCode: string;
  qtyOrdered: number;
  qtyAllocated?: number;
  qtyPicked: number;
  qtyShipped: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  qtyReturnedBefore?: number;
  notes?: string;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  orderType?: string;
  warehouseId: number;
  warehouseCode: string;
  customerCode: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingCountry?: string;
  status: number;
  orderDate: string;
  requestedDeliveryDate?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  currency?: string;
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  priority?: string;
  externalReference?: string;
  notes?: string;
  customerType?: string;
  actualDeliveryDate?: string;
  salesPerson?: string;
  createdBy?: string;
  carrierName?: string;
  trackingNumber?: string;
  lines: SalesOrderLine[];
}

export interface PickingOrderLine {
  id: number;
  salesOrderLineId: number;
  productId: number;
  productSku: string;
  productName: string;
  locationId: number;
  locationCode: string;
  locationName?: string;
  uomId: number;
  uomCode: string;
  qtyToPick: number;
  qtyPicked: number;
  lotNumber?: string;
  expiryDate?: string;
  trackLot: boolean;
  trackSerialNumber: boolean;
  serialNumbers: string[];
}

export interface PickingOrder {
  id: number;
  pickingNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName?: string;
  status: number;
  method?: string;
  totalLines?: number;
  completedLines?: number;
  progressPercent?: number;
  assignedTo?: string;
  assignedToName?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  lines: PickingOrderLine[];
}

export interface ShippingPackageLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  uomId: number;
  uomCode: string;
  qtyPacked: number;
  lotNumber?: string;
  serialNumbers: string[];
  notes?: string;
}

export interface ShippingPackage {
  id: number;
  packageNumber: string;
  pickingOrderId: number;
  pickingNumber?: string;
  salesOrderId?: number;
  salesOrderNumber?: string;
  salesOrderStatus?: number;
  trackingNumber?: string;
  carrierName?: string;
  carrierService?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  notes?: string;
  labelUrl?: string;
  zplContent?: string;
  labelType?: string;
  status: number;
  packedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  createdBy?: string;
  createdAt: string;
  lines: ShippingPackageLine[];
}
