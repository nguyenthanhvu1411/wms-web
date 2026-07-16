import httpClient from './httpClient';
import { type ApiResult, type PagedResponse, unwrapResult } from '@/types/common';
import type { PurchaseOrder, AdvanceShippingNotice, GoodsReceipt, QualityCheck, PutawayTask, ReturnToVendorQueryRequest, ReturnToVendorOrder, ShipReturnToVendorRequest } from '@/types/inbound';

export interface InboundQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  supplierId?: number;
  warehouseId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface UpdateGoodsReceiptRequest {
  notes?: string;
  vehiclePlate?: string;
  driverName?: string;
}

export interface PurchaseOrderQueryParams extends InboundQueryParams {
  status?: number;
}

export interface AsnQueryParams extends InboundQueryParams {
  status?: number;
}

export interface QualityCheckQueryParams extends InboundQueryParams {
  result?: number;
}

export interface GoodsReceiptQueryParams extends InboundQueryParams {
  status?: number;
  asnId?: number;
  purchaseOrderId?: number;
}

export interface PutawayTaskQueryParams extends InboundQueryParams {
  status?: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  lines: {
    productId: number;
    uomId: number;
    qtyOrdered: number;
    unitPrice: number;
    discountPercent?: number;
    notes?: string;
  }[];
}

export interface UpdatePurchaseOrderRequest extends CreatePurchaseOrderRequest {}

export interface CreateAsnRequest {
  supplierId: number;
  purchaseOrderId?: number;
  warehouseId: number;
  expectedArrivalDate?: string;
  carrierName?: string;
  trackingNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  notes?: string;
  lines: {
    productId: number;
    uomId: number;
    qtyExpected: number;
    lotNumber?: string;
    expiryDate?: string;
    manufactureDate?: string;
    countryOfOrigin?: string;
    notes?: string;
  }[];
}

export interface UpdateAsnRequest {
  expectedArrivalDate?: string;
  carrierName?: string;
  trackingNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  notes?: string;
}

export interface ConfirmGoodsReceiptLineRequest {
  goodsReceiptLineId: number;
  qtyReceived: number;
  lotNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  serialNumbers?: string[];
}

export interface ConfirmGoodsReceiptRequest {
  receivedDate?: string;
  receivedBy?: string;
  lines: ConfirmGoodsReceiptLineRequest[];
}

export interface CreateGoodsReceiptRequest {
  warehouseId: number;
  purchaseOrderId?: number;
  asnId?: number;
  receivedDate: string;
  supplierReference?: string;
  requiresQc: boolean;
  notes?: string;
  vehiclePlate?: string;
  driverName?: string;
  lines: {
    productId: number;
    uomId: number;
    purchaseOrderLineId?: number;
    qtyExpected: number;
    qtyReceived: number;
    lotNumber?: string;
    expiryDate?: string;
    manufactureDate?: string;
    unitCost: number;
    notes?: string;
  }[];
}

export interface CreateQualityCheckRequest {
  goodsReceiptId: number;
  methodUsed?: string;
  notes?: string;
}

export interface CompleteQualityCheckLineRequest {
  goodsReceiptLineId: number;
  qtyInspected: number;
  qtyPassed: number;
  qtyFailed: number;
  failureReason?: string;
  notes?: string;
  passedSerials?: string[];
  failedSerials?: string[];
}

export interface CompleteQualityCheckRequest {
  notes?: string;
  rejectReason?: string;
  lines: CompleteQualityCheckLineRequest[];
}

export interface UpdateQualityCheckMetadataRequest {
  inspectorId?: string;
  inspectedAt?: string;
  methodUsed?: string;
}

export interface ProcessQualityCheckFailedRequest {
  locationId: number;
  notes?: string;
}

export interface CreatePutawayTaskRequest {
  goodsReceiptId: number;
  goodsReceiptLineId: number;
  sourceLocationId: number;
  destinationLocationId: number;
  qtyToPutaway: number;
  assignedTo?: string;
  notes?: string;
}

export interface CompletePutawayTaskRequest {
  qtyPutaway: number;
  notes?: string;
  putawaySerials?: string[];
}

export const inboundApi = {
  // Purchase Orders
  getPurchaseOrders: async (params?: PurchaseOrderQueryParams) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<PurchaseOrder>>>('/api/inbound/purchase-orders', { params });
    return unwrapResult(res);
  },

  getPurchaseOrderById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<PurchaseOrder>>(`/api/inbound/purchase-orders/${id}`);
    return unwrapResult(res);
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderRequest) => {
    const res = await httpClient.post<any, ApiResult<PurchaseOrder>>('/api/inbound/purchase-orders', data);
    return unwrapResult(res);
  },

  updatePurchaseOrder: async (id: number, data: UpdatePurchaseOrderRequest) => {
    const res = await httpClient.put<any, ApiResult<PurchaseOrder>>(`/api/inbound/purchase-orders/${id}`, data);
    return unwrapResult(res);
  },

  submitPurchaseOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/purchase-orders/${id}/submit`);
    return unwrapResult(res);
  },

  approvePurchaseOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/purchase-orders/${id}/approve`);
    return unwrapResult(res);
  },

  cancelPurchaseOrder: async (id: number, reason?: string) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/purchase-orders/${id}/cancel`, { reason });
    return unwrapResult(res);
  },

  getAsns: async (params?: AsnQueryParams) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<AdvanceShippingNotice>>>('/api/inbound/asns', { params });
    return unwrapResult(res);
  },

  getAsnById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<AdvanceShippingNotice>>(`/api/inbound/asns/${id}`);
    return unwrapResult(res);
  },

  createAsn: async (data: CreateAsnRequest) => {
    const res = await httpClient.post<any, ApiResult<AdvanceShippingNotice>>('/api/inbound/asns', data);
    return unwrapResult(res);
  },

  updateAsn: async (id: number, data: UpdateAsnRequest) => {
    const res = await httpClient.put<any, ApiResult<AdvanceShippingNotice>>(`/api/inbound/asns/${id}`, data);
    return unwrapResult(res);
  },

  markAsnInTransit: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/asns/${id}/in-transit`);
    return unwrapResult(res);
  },

  markAsnArrived: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/asns/${id}/arrive`);
    return unwrapResult(res);
  },

  confirmAsn: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/asns/${id}/confirm`);
    return unwrapResult(res);
  },

  cancelAsn: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/asns/${id}/cancel`);
    return unwrapResult(res);
  },

  getGoodsReceipts: async (params?: GoodsReceiptQueryParams) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<GoodsReceipt>>>('/api/inbound/goods-receipts', { params });
    return unwrapResult(res);
  },

  getGoodsReceiptById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<GoodsReceipt>>(`/api/inbound/goods-receipts/${id}`);
    return unwrapResult(res);
  },

  createGoodsReceipt: async (data: CreateGoodsReceiptRequest) => {
    const res = await httpClient.post<any, ApiResult<GoodsReceipt>>('/api/inbound/goods-receipts', data);
    return unwrapResult(res);
  },

  updateGoodsReceipt: async (id: number, data: UpdateGoodsReceiptRequest) => {
    const res = await httpClient.put<any, ApiResult<GoodsReceipt>>(`/api/inbound/goods-receipts/${id}`, data);
    return unwrapResult(res);
  },

  startReceiving: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/goods-receipts/${id}/start-receiving`);
    return unwrapResult(res);
  },

  completeGoodsReceipt: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/goods-receipts/${id}/complete`);
    return unwrapResult(res);
  },

  cancelGoodsReceipt: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/goods-receipts/${id}/cancel`);
    return unwrapResult(res);
  },

  confirmGoodsReceipt: async (id: number, data: ConfirmGoodsReceiptRequest) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/goods-receipts/${id}/confirm`, data);
    return unwrapResult(res);
  },

  // Quality Checks
  getQualityChecks: async (params?: QualityCheckQueryParams) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<QualityCheck>>>('/api/inbound/quality-checks', { params });
    return unwrapResult(res);
  },

  getQualityCheckById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<QualityCheck>>(`/api/inbound/quality-checks/${id}`);
    return unwrapResult(res);
  },

  createQualityCheck: async (data: CreateQualityCheckRequest) => {
    const res = await httpClient.post<any, ApiResult<QualityCheck>>('/api/inbound/quality-checks', data);
    return unwrapResult(res);
  },

  completeQualityCheck: async (id: number, data: CompleteQualityCheckRequest) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/quality-checks/${id}/complete`, data);
    return unwrapResult(res);
  },

  updateQualityCheckMetadata: async (id: number, data: UpdateQualityCheckMetadataRequest) => {
    const res = await httpClient.put<any, ApiResult<QualityCheck>>(`/api/inbound/quality-checks/${id}/metadata`, data);
    return unwrapResult(res);
  },

  quarantineQualityCheckFailed: async (id: number, data: ProcessQualityCheckFailedRequest) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/quality-checks/${id}/quarantine`, data);
    return unwrapResult(res);
  },

  markQualityCheckFailedDamaged: async (id: number, data: ProcessQualityCheckFailedRequest) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/quality-checks/${id}/mark-damaged`, data);
    return unwrapResult(res);
  },

  // Putaway Tasks
  getPutawayTasks: async (params?: PutawayTaskQueryParams) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<PutawayTask>>>('/api/inbound/putaway-tasks', { params });
    return unwrapResult(res);
  },

  getPutawayTaskById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<PutawayTask>>(`/api/inbound/putaway-tasks/${id}`);
    return unwrapResult(res);
  },

  createPutawayTask: async (data: CreatePutawayTaskRequest) => {
    const res = await httpClient.post<any, ApiResult<PutawayTask>>('/api/inbound/putaway-tasks', data);
    return unwrapResult(res);
  },

  completePutawayTask: async (id: number, data: CompletePutawayTaskRequest) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/inbound/putaway-tasks/${id}/complete`, data);
    return unwrapResult(res);
  },

  // Vendor Returns
  getVendorReturns: async (params?: ReturnToVendorQueryRequest) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<ReturnToVendorOrder>>>('/api/returns/vendor', { params });
    return unwrapResult(res);
  },
  getVendorReturnById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<ReturnToVendorOrder>>(`/api/returns/vendor/${id}`);
    return unwrapResult(res);
  },
  createVendorReturnFromQc: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<ReturnToVendorOrder>>('/api/returns/vendor/from-qc', data);
    return unwrapResult(res);
  },
  submitVendorReturn: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/returns/vendor/${id}/submit`);
    return unwrapResult(res);
  },
  approveVendorReturn: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/returns/vendor/${id}/approve`);
    return unwrapResult(res);
  },
  shipVendorReturn: async (id: number, data?: ShipReturnToVendorRequest) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/returns/vendor/${id}/ship`, data);
    return unwrapResult(res);
  },
  completeVendorReturn: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/returns/vendor/${id}/complete`);
    return unwrapResult(res);
  },
  cancelVendorReturn: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/returns/vendor/${id}/cancel`);
    return unwrapResult(res);
  },

  // Finance
  getVendorInvoices: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<any>>>('/api/finance/invoices', { params });
    return unwrapResult(res);
  },
  getVendorInvoiceById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<any>>(`/api/finance/invoices/${id}`);
    return unwrapResult(res);
  },
  createVendorInvoice: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<any>>('/api/finance/invoices', data);
    return unwrapResult(res);
  },

  approveVendorInvoice: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<any>>(`/api/finance/invoices/${id}/approve`);
    return unwrapResult(res);
  },
  getThreeWayMatches: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<any>>>('/api/finance/matches', { params });
    return unwrapResult(res);
  },
  getThreeWayMatchById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<any>>(`/api/finance/matches/${id}`);
    return unwrapResult(res);
  },
  runThreeWayMatch: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/finance/invoices/${id}/match`);
    return unwrapResult(res);
  },
  getPaymentRequests: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<any>>>('/api/finance/payment-requests', { params });
    return unwrapResult(res);
  },
  getPaymentRequestById: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<any>>(`/api/finance/payment-requests/${id}`);
    return unwrapResult(res);
  },
  createPaymentRequest: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<any>>(`/api/finance/matches/${id}/payment-request`);
    return unwrapResult(res);
  },
};
