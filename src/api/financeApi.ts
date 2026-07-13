import httpClient from './httpClient';
import type { ApiResponse, PagedResponse } from '@/types/common';
import type {
  VendorInvoice,
  PaymentRequest,
  ApprovePaymentRequestRequest,
  ProcessPaymentRequest,
  CancelPaymentRequestRequest,
  FinancialDashboardResponse,
  ApAgingReportRequest,
  ApAgingReportRowResponse
} from '@/types/operations';
import { unwrapResult } from '@/types/common';

export const financeApi = {
  getDashboard: async (asOfDate?: string) => {
    const params = asOfDate ? { asOfDate } : {};
    const res = await httpClient.get<any, ApiResponse<FinancialDashboardResponse>>('/api/finance/dashboard', { params });
    return unwrapResult(res);
  },

  getApAgingReport: async (params: ApAgingReportRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ApAgingReportRowResponse>>>('/api/finance/ap-aging', { params });
    return unwrapResult(res);
  },

  getPaymentRequests: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<PaymentRequest>>>('/api/finance/payments', { params });
    return unwrapResult(res);
  },

  getPaymentRequestById: async (id: number) => {
    const res = await httpClient.get<any, ApiResponse<PaymentRequest>>(`/api/finance/payments/${id}`);
    return unwrapResult(res);
  },

  approvePaymentRequest: async (id: number, data: ApprovePaymentRequestRequest) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/finance/payments/${id}/approve`, data);
    return unwrapResult(res);
  },

  processPayment: async (id: number, data: ProcessPaymentRequest) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/finance/payments/${id}/process`, data);
    return unwrapResult(res);
  },

  cancelPaymentRequest: async (id: number, data: CancelPaymentRequestRequest) => {
    const res = await httpClient.post<any, ApiResponse<any>>(`/api/finance/payments/${id}/cancel`, data);
    return unwrapResult(res);
  }
};
