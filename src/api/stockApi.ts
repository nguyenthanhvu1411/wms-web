import httpClient from './httpClient';
import type { StockBalance, StockTransaction } from '@/types/stock';
import { type ApiResult, type PagedResponse, unwrapResult } from '@/types/common';

export interface StockBalanceQueryRequest {
  page?: number;
  pageSize?: number;
  warehouseId?: number;
  locationId?: number;
  productId?: number;
  lotNumber?: string;
  expiringBefore?: string;
  lowStockOnly?: boolean;
  search?: string;
}

export const stockApi = {
  getOnHand: async (params?: StockBalanceQueryRequest) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<StockBalance>>>('/api/stock/on-hand', { params });
    return unwrapResult(res);
  },

  getTransactions: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<StockTransaction>>>('/api/stock/transactions', { params });
    return unwrapResult(res);
  },

  getSerials: async (params?: any) => {
    const res = await httpClient.get<any, ApiResult<PagedResponse<any>>>('/api/stock/serials', { params });
    return unwrapResult(res);
  },

  createOpeningStock: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>('/api/stock/opening-stock', data);
    return unwrapResult(res);
  },

  adjustStock: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>('/api/stock/adjustments', data);
    return unwrapResult(res);
  },

  reserveStock: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>('/api/stock/reservations', data);
    return unwrapResult(res);
  },

  releaseReservation: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>('/api/stock/reservations/release', data);
    return unwrapResult(res);
  },

  holdStock: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>('/api/stock/holds', data);
    return unwrapResult(res);
  },

  releaseHold: async (data: any) => {
    const res = await httpClient.post<any, ApiResult<boolean>>('/api/stock/holds/release', data);
    return unwrapResult(res);
  },
};
