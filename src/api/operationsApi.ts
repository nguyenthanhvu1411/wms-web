import httpClient from './httpClient';
import type { TransferOrder, ReturnOrder, CycleCount, VendorInvoice } from '@/types/operations';
import type { ApiResponse, PaginatedData, PagedResponse } from '@/types/common';
import { unwrapResult } from '@/types/common';

export const operationsApi = {
  getTransfers: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<TransferOrder>>>('/api/transfers', { params });
    return res.data;
  },
  
  getStockOnHand: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<any>>>('/api/stock/on-hand', { params });
    return res.data;
  },

  
  getCustomerReturns: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReturnOrder>>>('/api/returns/customer', { params });
    return unwrapResult(res);
  },


  getCycleCounts: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<CycleCount>>>('/api/cycle-counts', { params });
    return res.data;
  },

  getVendorInvoices: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<VendorInvoice>>>('/api/finance/invoices', { params });
    return res.data;
  },

  // Customer Return Endpoints
  getCustomerReturnById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<ReturnOrder>>(`/api/returns/customer/${id}`);
    return unwrapResult(res);
  },
  createReturnOrder: async (data: any) => {
    const res = await httpClient.post<any, ApiResponse<ReturnOrder>>(`/api/returns/customer`, data);
    return unwrapResult(res);
  },
  receiveReturnOrder: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/receive`, data);
    return unwrapResult(res);
  },
  inspectReturnOrder: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/inspect`, data);
    return unwrapResult(res);
  },
  submitReturnOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/submit`);
    return unwrapResult(res);
  },
  approveReturnOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/approve`);
    return unwrapResult(res);
  },
  rejectReturnOrder: async (id: number, reason: string) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/reject`, { reason });
    return unwrapResult(res);
  },
  cancelReturnOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/cancel`);
    return unwrapResult(res);
  },
  completeReturnOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/returns/customer/${id}/complete`);
    return unwrapResult(res);
  },


  // Transfer Endpoints
  getTransfer: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<TransferOrder>>(`/api/transfers/${id}`);
    return unwrapResult(res);
  },
  createTransfer: async (data: any) => {
    const res = await httpClient.post<any, ApiResponse<TransferOrder>>(`/api/transfers`, data);
    return unwrapResult(res);
  },
  approveTransfer: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/approve`);
    return unwrapResult(res);
  },
  startPicking: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/start-picking`);
    return unwrapResult(res);
  },
  confirmPicking: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/confirm-picking`, data);
    return unwrapResult(res);
  },
  markInTransitTransfer: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/mark-in-transit`, data);
    return res.data;
  },
  startReceivingTransfer: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/start-receiving`);
    return res.data;
  },
  receiveTransfer: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/receive`, data);
    return unwrapResult(res);
  },
  dispatchTransfer: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/dispatch`);
    return unwrapResult(res);
  },
  rejectTransfer: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/reject`, data);
    return unwrapResult(res);
  },
  cancelTransfer: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/cancel`);
    return unwrapResult(res);
  },
  completeTransfer: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/complete`);
    return unwrapResult(res);
  },
  submitTransfer: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/transfers/${id}/submit`);
    return unwrapResult(res);
  },

  // Cycle Count Endpoints
  getCycleCountDashboard: async () => {
    const res = await httpClient.get<any, ApiResponse<any>>(`/api/cycle-counts/dashboard`);
    return unwrapResult(res);
  },
  getCycleCount: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<CycleCount>>(`/api/cycle-counts/${id}`);
    return unwrapResult(res);
  },
  createCycleCount: async (data: any) => {
    const res = await httpClient.post<any, ApiResponse<CycleCount>>(`/api/cycle-counts`, data);
    return res.data;
  },
  updateCycleCount: async (id: number, data: any) => {
    const res = await httpClient.put<any, ApiResponse<CycleCount>>(`/api/cycle-counts/${id}`, data);
    return res.data;
  },
  countCycleCountLine: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/lines/${id}/count`, data);
    return res.data;
  },
  approveCycleCount: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/approve`);
    return res.data;
  },
  startCycleCount: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/start-count`);
    return res.data;
  },
  completeCycleCount: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/complete-count`);
    return res.data;
  },
  reviewCycleCountDifference: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/review-difference`);
    return res.data;
  },
  adjustCycleCountInventory: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/adjust`);
    return res.data;
  },
  completeCycleCountWorkflow: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/complete`);
    return res.data;
  },
  cancelCycleCount: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/cycle-counts/${id}/cancel`);
    return res.data;
  },
};
