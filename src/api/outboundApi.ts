import httpClient from './httpClient';
import type { SalesOrder, PickingOrder, ShippingPackage } from '@/types/outbound';
import { type ApiResult, type PagedResponse, unwrapResult } from '@/types/common';

export const outboundApi = {
  getSalesOrders: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<SalesOrder>>>('/api/sales-orders', { params });
    return unwrapResult(res);
  },

  getSalesOrder: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<SalesOrder>>(`/api/sales-orders/${id}`);
    return unwrapResult(res);
  },

  createSalesOrder: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<SalesOrder>>('/api/sales-orders', data);
    return unwrapResult(res);
  },

  updateSalesOrder: async (id: number, data: any) => {
    const res = await httpClient.put<any, ApiResult<SalesOrder>>(`/api/sales-orders/${id}`, data);
    return unwrapResult(res);
  },

  submitSalesOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/submit`);
    return unwrapResult(res);
  },

  approveSalesOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/approve`);
    return unwrapResult(res);
  },

  rejectSalesOrder: async (id: number, reason: string) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
    return unwrapResult(res);
  },

  releaseSalesOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/release`);
    return unwrapResult(res);
  },

  holdSalesOrder: async (id: number, reason: string) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/hold`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
    return unwrapResult(res);
  },

  unHoldSalesOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/unhold`);
    return unwrapResult(res);
  },

  cancelSalesOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/cancel`);
    return unwrapResult(res);
  },

  closeSalesOrder: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/sales-orders/${id}/close`);
    return unwrapResult(res);
  },

  getPickingOrders: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<PickingOrder>>>('/api/picking-orders', { params });
    return unwrapResult(res);
  },

  getPickingOrder: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<PickingOrder>>(`/api/picking-orders/${id}`);
    return unwrapResult(res);
  },

  createPickingOrder: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<PickingOrder>>('/api/picking-orders', data);
    return unwrapResult(res);
  },

  pickLine: async (lineId: number, data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/picking-orders/lines/${lineId}/pick`, data);
    return unwrapResult(res);
  },

  assignPickingOrder: async (id: number, data: { assignedTo?: string }) => {
    const res = await httpClient.post<any, ApiResult<PickingOrder>>(`/api/picking-orders/${id}/assign`, data);
    return unwrapResult(res);
  },

  getShippingPackages: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<ShippingPackage>>>('/api/shipping/packages', { params });
    return unwrapResult(res);
  },

  getShippingPackage: async (id: number) => {
    const res = await httpClient.get<any, ApiResult<ShippingPackage>>(`/api/shipping/packages/${id}`);
    return unwrapResult(res);
  },

  createShippingPackage: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<ShippingPackage>>('/api/shipping/packages', data);
    return unwrapResult(res);
  },

  dispatchPackage: async (id: number, data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/shipping/packages/${id}/dispatch`, data);
    return unwrapResult(res);
  },

  markPackageDelivered: async (id: number) => {
    const res = await httpClient.post<any, ApiResult<boolean>>(`/api/shipping/packages/${id}/delivered`);
    return unwrapResult(res);
  },
};
