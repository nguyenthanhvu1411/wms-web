import { PurchaseOrderStatus } from './wms-enums';

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  currency?: string;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  linkedAsnId?: number;
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  uomId: number;
  uomCode: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyPending: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  notes?: string;
}

export interface AdvanceShippingNotice {
  id: number;
  asnNumber: string;
  supplierId: number;
  supplierCode?: string;
  supplierName: string;
  purchaseOrderId?: number;
  poNumber?: string;
  warehouseId: number;
  warehouseCode?: string;
  warehouseName: string;
  expectedArrivalDate: string;
  actualArrivalDate?: string;
  carrierName?: string;
  trackingNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  status: number;
  notes?: string;
  lines?: AdvanceShippingNoticeLine[];
}

export interface AdvanceShippingNoticeLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  uomId: number;
  uomCode: string;
  qtyExpected: number;
  lotNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  countryOfOrigin?: string;
  notes?: string;
}

export interface GoodsReceipt {
  id: number;
  grNumber: string;
  warehouseId: number;
  warehouseCode?: string;
  warehouseName: string;
  purchaseOrderId?: number;
  poNumber?: string;
  supplierId?: number;
  supplierCode?: string;
  supplierName?: string;
  asnId?: number;
  asnNumber?: string;
  status: number;
  receivedDate?: string;
  receivedBy?: string;
  requiresQc: boolean;
  supplierReference?: string;
  vehiclePlate?: string;
  driverName?: string;
  qualityCheckId?: number;
  qualityCheckNumber?: string;
  notes?: string;
  lines?: GoodsReceiptLine[];
}

export interface GoodsReceiptLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productBarcode?: string;
  suggestedLocation?: string;
  uomId: number;
  uomCode: string;
  purchaseOrderLineId?: number;
  qtyOrdered?: number;
  qtyPreviouslyReceived?: number;
  qtyExpected: number;
  qtyReceived: number;
  qtyAccepted: number;
  qtyRejected: number;
  lotNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  unitCost: number;
  notes?: string;
  trackLot?: boolean;
  trackSerialNumber?: boolean;
  serialNumbers?: string[];
}

export interface QualityCheckLine {
  id: number;
  goodsReceiptLineId: number;
  productId: number;
  productSku: string;
  productName: string;
  qtyInspected: number;
  qtyPassed: number;
  qtyFailed: number;
  lineResult: number;
  failureReason?: string;
  notes?: string;
  lotNumber?: string;
  trackLot?: boolean;
  trackSerialNumber?: boolean;
  serialNumbers?: string[];
  passedSerials?: string[];
  failedSerials?: string[];
}

export interface QualityCheck {
  id: number;
  qcNumber: string;
  goodsReceiptId: number;
  grNumber: string;
  warehouseId: number;
  result: number;
  inspectorId?: string;
  inspectorName?: string;
  inspectedAt?: string;
  methodUsed?: string;
  notes?: string;
  rejectReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  lines?: QualityCheckLine[];
}

export interface PutawayTask {
  id: number;
  taskNumber: string;
  goodsReceiptId: number;
  grNumber: string;
  goodsReceiptLineId: number;
  productId: number;
  productSku: string;
  productName: string;
  sourceLocationId: number;
  sourceLocationCode: string;
  destinationLocationId: number;
  destinationLocationCode: string;
  qtyToPutaway: number;
  qtyPutaway: number;
  lotNumber?: string;
  expiryDate?: string;
  status: number;
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  trackLot?: boolean;
  trackSerialNumber?: boolean;
  serialNumbers?: string[];
}

export interface ConfirmGrLineRequest {
  goodsReceiptLineId: number;
  qtyReceived: number;
  lotNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  serialNumbers: string[];
}

export interface ConfirmGrRequest {
  lines: ConfirmGrLineRequest[];
}

export interface ReturnToVendorQueryRequest {
  status?: number;
  search?: string;
  supplierId?: number;
  warehouseId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface VendorInvoiceQueryRequest {
  status?: number;
  search?: string;
  supplierId?: number;
  warehouseId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ThreeWayMatchQueryRequest {
  status?: number;
  search?: string;
  supplierId?: number;
  warehouseId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentRequestQueryRequest {
  status?: number;
  search?: string;
  supplierId?: number;
  warehouseId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ThreeWayMatchResponse {
  id: number;
  matchNumber: string;
  purchaseOrderId: number;
  goodsReceiptId: number;
  vendorInvoiceId: number;
  status: number;
  discrepancyReason?: string;
  matchedAt?: string;
  matchedBy?: string;
}

export interface PaymentRequestResponse {
  id: number;
  paymentRequestNumber: string;
  vendorInvoiceId: number;
  threeWayMatchId: number;
  supplierId: number;
  amount: number;
  currency: string;
  status: number;
}

export interface ReturnToVendorLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  uomId: number;
  uomCode: string;
  goodsReceiptLineId?: number;
  fromLocationId?: number;
  fromLocationCode?: string;
  qtyReturned: number;
  qtyQCPassed?: number;
  qtyQCFailed?: number;
  unitCost: number;
  totalCost: number;
  lotNumber?: string;
  serialNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  
  barcode?: string;
  category?: string;
  brand?: string;
  manufacturer?: string;
  origin?: string;
  
  reason?: string;
  defectCode?: string;
  defectDescription?: string;
  notes?: string;
  
  serialNumbers: string[];
}

export interface ReturnToVendorOrder {
  id: number;
  returnNumber: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  goodsReceiptId?: number;
  qualityCheckId?: number;
  status: number;
  reason: string;
  notes?: string;
  returnDate: string;

  // Supplier Snapshot
  supplierCode?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  contactPerson?: string;
  supplierTaxCode?: string;
  supplierPaymentTerm?: number;

  warehouseCode?: string;
  returnLocationId?: number;
  quarantineLocationId?: number;

  // Document Links
  purchaseOrderId?: number;
  poNumber?: string;
  poDate?: string;
  asnNumber?: string;
  grNumber?: string;
  grDate?: string;
  qcNumber?: string;
  qcDate?: string;
  inspectionNumber?: string;

  // Logistics
  shippingMethod?: string;
  deliveryNote?: string;
  packingList?: string;
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  shippingDate?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  receivedBySupplier?: string;
  shippingStatus?: string;

  // Finance
  currency?: string;
  totalQty: number;
  subTotal?: number;
  taxAmount?: number;
  totalCost: number;
  grandTotal?: number;
  restockingFee?: number;
  creditNote?: string;
  debitNote?: string;
  supplierRefund?: number;
  replacementOrder?: string;
  
  qcDecision?: string;
  qcResult?: string;
  qcInspector?: string;
  qcInspectionDate?: string;
  qcReport?: string;
  
  rtvNumber?: string;

  // Timestamps & Audit
  createdAt?: string;
  createdBy?: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  shippedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  completedAt?: string;
  completedBy?: string;

  lines: ReturnToVendorLine[];
}

export interface ShipReturnToVendorRequest {
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
}

