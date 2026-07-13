export interface TransferOrderQueryRequest {
  fromWarehouseId?: number;
  toWarehouseId?: number;
  warehouseId?: number;
  status?: number;
  keyword?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTransferOrderLineRequest {
  productId: number;
  uomId: number;
  qtyRequested: number;
  lotNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  reason?: string;
}

export interface CreateTransferOrderRequest {
  fromWarehouseId: number;
  toWarehouseId: number;
  fromLocationId: number;
  toLocationId: number;
  productId?: number;
  uomId?: number;
  qtyRequested?: number;
  lotNumber?: string;
  expiryDate?: string;
  reason?: string;
  notes?: string;
  carrier?: string;
  vehicle?: string;
  driver?: string;
  priority?: number;
  plannedDate?: string;
  lines?: CreateTransferOrderLineRequest[];
}

export interface StartPickingRequest {
  pickedBy?: string;
  notes?: string;
}

export interface ConfirmPickingRequest {
  notes?: string;
}

export interface MarkInTransitRequest {
  carrier?: string;
  vehicle?: string;
  driver?: string;
  notes?: string;
}

export interface ReceiveTransferRequest {
  receivedBy?: string;
  notes?: string;
}

export interface CancelTransferRequest {
  reason?: string;
}

export interface TransferOrderLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  uomCode: string;
  lotNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  qtyRequested: number;
  qtyReserved: number;
  qtyPicked: number;
  qtyReceived: number;
  qtyVariance: number;
  unitCost: number;
  reason?: string;
}

export interface TransferOrder {
  id: number;
  transferNumber: string;
  fromWarehouseId: number;
  fromWarehouseCode: string;
  fromWarehouseName: string;
  toWarehouseId: number;
  toWarehouseCode: string;
  toWarehouseName: string;
  fromLocationId: number;
  fromLocationCode: string;
  toLocationId: number;
  toLocationCode: string;
  productId: number;
  productSku: string;
  productName: string;
  uomCode: string;
  qtyRequested: number;
  qtyTransferred: number;
  unitCost: number;
  totalValue: number;
  lotNumber?: string;
  expiryDate?: string;
  status: number;
  priority: number;
  reason?: string;
  notes?: string;
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  pickedBy?: string;
  pickedAt?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  executedBy?: string;
  executedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  carrier?: string;
  vehicle?: string;
  driver?: string;
  plannedDate?: string;
  actualDate?: string;
  createdAt: string;
  updatedAt: string;
  lines?: TransferOrderLine[];
}

export interface ReturnOrderQueryRequest {
  salesOrderId?: number;
  warehouseId?: number;
  status?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateReturnOrderLineRequest {
  salesOrderLineId?: number;
  productId: number;
  uomId: number;
  locationId: number;
  qtyExpected: number;
  lotNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  notes?: string;
  reasonCode?: string;
  amount?: number;
}

export interface CreateReturnOrderRequest {
  salesOrderId: number;
  reason?: string;
  notes?: string;
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  orderType?: string;
  lines: CreateReturnOrderLineRequest[];
}

export interface ReceiveReturnLineRequest {
  returnOrderLineId: number;
  qtyReceived: number;
}

export interface ReceiveReturnOrderRequest {
  lines: ReceiveReturnLineRequest[];
  notes?: string;
}

export interface InspectReturnLineRequest {
  returnOrderLineId: number;
  qtySellable: number;
  qtyQuarantined: number;
  qtyDamaged: number;
  qtyScrapped: number;
  notes?: string;
}

export interface InspectReturnOrderRequest {
  lines: InspectReturnLineRequest[];
  notes?: string;
}

export interface ReturnOrderResponse {
  id: number;
  returnNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  status: number;
  orderType?: string;
  reason?: string;
  receivedAt?: string;
  lines?: ReturnOrderLine[];

  // Customer Info
  customerCode?: string;
  customerName?: string;
  customerType?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;

  // Financial Info
  totalQty?: number;
  totalSku?: number;
  totalAmount?: number;
  refundAmount?: number;
  restockingFee?: number;
  shippingFee?: number;
  taxAmount?: number;
  grandTotal?: number;

  // Document Links
  invoiceNumber?: string;
  deliveryNumber?: string;
  shipmentNumber?: string;

  // Logistics
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;

  // Staff & Audit
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedBy?: string;
  inspector?: string;
  inspectedAt?: string;
  completedBy?: string;
  completedAt?: string;
}

export interface ReturnOrder {
  id: number;
  returnNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  status: number;
  orderType?: string;
  reason?: string;
  notes?: string;
  lines?: ReturnOrderLine[];

  // Customer Info
  customerCode?: string;
  customerName?: string;
  customerType?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;

  // Financial Info
  totalQty?: number;
  totalSku?: number;
  totalAmount?: number;
  refundAmount?: number;
  restockingFee?: number;
  shippingFee?: number;
  taxAmount?: number;
  grandTotal?: number;

  // Document Links
  invoiceNumber?: string;
  deliveryNumber?: string;
  shipmentNumber?: string;

  // Logistics
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;

  // Staff & Audit
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  inspector?: string;
  inspectedAt?: string;
  completedBy?: string;
  completedAt?: string;
}

export interface ReturnToVendor {
  id: number;
  returnNumber: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  goodsReceiptId?: number;
  qualityCheckId?: number;
  status: number;
  reason?: string;
  notes?: string;
  returnDate: string;

  // Supplier Snapshot
  supplierCode?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  contactPerson?: string;

  // Document Links
  purchaseOrderId?: number;
  poNumber?: string;
  asnNumber?: string;
  grNumber?: string;
  qcNumber?: string;
  inspectionNumber?: string;

  // Logistics
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  shippingDate?: string;
  estimatedArrival?: string;
  receivedBySupplier?: string;

  // Finance
  totalQty?: number;
  totalCost?: number;
  creditNote?: string;
  debitNote?: string;
  supplierRefund?: number;
  replacementOrder?: string;

  // Staff
  createdBy?: string;
  approvedBy?: string;

  // QC Info
  qcDecision?: string;
  qcReport?: string;

  lines?: ReturnToVendorLine[];
}

export interface CycleCount {
  id: number;
  countNumber: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  status: number;
  method: number;
  totalLines: number;
  countedLines: number;
  varianceLines: number;
  totalVarianceQty: number;
  totalAdjustmentValue: number;
  assignedTo?: string;
  assignedToFullName?: string;
  approvedBy?: string;
  approvedAt?: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  reasonCode?: string;
  createdAt: string;
  updatedAt: string;
  lines?: CycleCountLine[];
}

export interface VendorInvoice {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  purchaseOrderId?: number;
  poNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  taxAmount: number;
  status: number;
  notes?: string;
}

export interface PaymentRequest {
  id: number;
  vendorInvoiceId: number;
  requestNumber: string;
  amountToPay: number;
  status: number;
  dueDate?: string;
  notes?: string;
  requestedBy?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export interface ApprovePaymentRequestRequest {
  notes?: string;
}

export interface ProcessPaymentRequest {
  paymentMethod?: string;
  paymentReference?: string;
  paymentDate?: string;
  notes?: string;
}

export interface CancelPaymentRequestRequest {
  reason?: string;
}

export interface FinancialDashboardResponse {
  totalAccountsPayable: number;
  pendingInvoicesCount: number;
  approvedInvoicesCount: number;
  pendingPaymentsCount: number;
  paidPaymentsCount: number;
  totalPaidThisMonth: number;
  inventoryValue: number;
}

export interface ApAgingReportRequest {
  asOfDate?: string;
  supplierId?: number;
  page?: number;
  pageSize?: number;
}

export interface ApAgingReportRowResponse {
  invoiceId: number;
  invoiceNumber: string;
  supplierCode: string;
  supplierName: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  amountCurrent: number;
  amount1To30: number;
  amount31To60: number;
  amount61To90: number;
  amountOver90: number;
}

export interface ReturnOrderLine {
  id: number;
  salesOrderLineId?: number;
  productId: number;
  productSku: string;
  productName?: string;
  uomId: number;
  uomCode: string;
  locationId: number;
  locationCode: string;
  warehouseCode?: string;

  qtyOrdered?: number;
  qtyDelivered?: number;
  qtyReturnedBefore?: number;
  qtyCanReturn?: number;
  qtyExpected: number;
  qtyReceived: number;
  qtySellable?: number;
  qtyQuarantined?: number;
  qtyDamaged?: number;
  qtyScrapped?: number;

  unitPrice?: number;
  discount?: number;
  tax?: number;
  amount?: number;
  refundAmount?: number;

  returnReason?: string;
  qcResult?: string;

  status: number;
  lotNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  serialNumbers?: string[];
}

export interface CycleCountLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  barcode?: string;
  locationId: number;
  locationCode: string;
  lotNumber?: string;
  expiryDate?: string;
  uomId: number;
  uomCode: string;
  qtySystem: number;
  qtyCounted?: number;
  variance: number;
  variancePct: number;
  unitCost: number;
  adjustmentValue: number;
  isCounted: boolean;
  isAdjusted: boolean;
  countedBy?: string;
  countedByFullName?: string;
  countedAt?: string;
  notes?: string;
}

export interface CycleCountQueryRequest {
  warehouseId?: number;
  status?: number;
  method?: number;
  keyword?: string;
  assignedTo?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  hasVariance?: boolean;
  onlyPendingApproval?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateCycleCountRequest {
  warehouseId: number;
  method: number;
  scheduledDate?: string;
  assignedTo?: string;
  notes?: string;
  locationIds?: number[];
}

export interface CountCycleCountLineRequest {
  qtyCounted: number;
  notes?: string;
}

export interface InventoryReportQueryRequest {
  warehouseId?: number;
  locationId?: number;
  productId?: number;
  lotNumber?: string;
  expiringBefore?: string;
  lowStockOnly?: boolean;
  expiryFrom?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryReportRowResponse {
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseCode: string;
  locationId: number;
  locationCode: string;
  lotNumber?: string;
  expiryDate?: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyInTransit: number;
  qtyOnHold: number;
  qtyQuarantined: number;
  qtyDamaged: number;
  qtyAvailable: number;
  averageCost: number;
  totalValue: number;
}

export interface ReportQueryRequest {
  fromDate?: string;
  toDate?: string;
  warehouseId?: number;
  productId?: number;
  supplierId?: number;
  customer?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportRowResponse {
  values: Record<string, string>;
}

// Typed DTO from backend InventoryKpiResponse
export interface InventoryKpiResponse {
  productId: number;
  productSku: string;
  productName: string;
  warehouseCode: string;
  qtyOnHand: number;
  totalValue: number;
  turnoverRatio: number;
  daysSinceLastMovement: number;
  slowMovingScore: number;
  isDeadStock: boolean;
  isSlowMoving: boolean;
  isFastMoving: boolean;
  abcClass: string; // A / B / C
}

// Typed DTO from backend AbcAnalysisResponse
export interface AbcAnalysisResponse {
  productId: number;
  productSku: string;
  productName: string;
  annualRevenue: number;
  cumulativePct: number;
  abcClass: string;
  rank: number;
}

export interface ReconciliationQueryRequest {
  warehouseId?: number;
  productId?: number;
  locationId?: number;
  lotNumber?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
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


export interface ReturnToVendorLine {
  id: number;
  rtvOrderId: number;
  productId: number;
  productSku: string;
  productName: string;
  qtyReturned: number;
  qtyShipped: number;
  uomCode: string;
  lotNumber?: string;
  serialNumbers?: string[];
  trackLot?: boolean;
  trackSerialNumber?: boolean;
}



export interface CycleCountLine {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  barcode?: string;
  locationId: number;
  locationCode: string;
  lotNumber?: string;
  expiryDate?: string;
  uomId: number;
  uomCode: string;
  qtySystem: number;
  qtyCounted?: number;
  variance: number;
  variancePct: number;
  unitCost: number;
  adjustmentValue: number;
  isCounted: boolean;
  isAdjusted: boolean;
  countedBy?: string;
  countedByFullName?: string;
  countedAt?: string;
  notes?: string;
  serialNumbers?: string[];
}

