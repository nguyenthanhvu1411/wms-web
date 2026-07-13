import httpClient from './httpClient';
import type { ApiResponse, PagedResponse } from '@/types/common';
import type { 
  ReconciliationQueryRequest, 
  ReconciliationResponse,
  InventoryReportQueryRequest,
  InventoryReportRowResponse,
  ReportQueryRequest,
  ReportRowResponse,
  InventoryKpiResponse,
  AbcAnalysisResponse
} from '@/types/operations';

export const reportsApi = {
  getInventoryReconciliation: async (params: ReconciliationQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReconciliationResponse>>>('/api/reports/inventory-reconciliation', { params });
    return res.data;
  },
  getInventory: async (params: InventoryReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<InventoryReportRowResponse>>>('/api/reports/inventory', { params });
    return res.data;
  },
  getInbound: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/inbound', { params });
    return res.data;
  },
  getOutbound: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/outbound', { params });
    return res.data;
  },
  getLowStock: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/low-stock', { params });
    return res.data;
  },
  getExpiry: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/expiry', { params });
    return res.data;
  },
  getSupplierPerformance: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/supplier-performance', { params });
    return res.data;
  },
  getCycleCountVariance: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/cycle-count-variance', { params });
    return res.data;
  },
  getTransferInTransit: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/transfer-in-transit', { params });
    return res.data;
  },
  getWarehouseUtilization: async (params: ReportQueryRequest) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<ReportRowResponse>>>('/api/reports/warehouse-utilization', { params });
    return res.data;
  },
  exportInventoryCsv: async (params: InventoryReportQueryRequest) => {
    // Return blob or handling logic usually, but backend returns FileExportResponse wrapped in ActionResult?
    // Let's assume it returns { fileName, contentType, base64Content }
    const res = await httpClient.get<any, ApiResponse<any>>('/api/reports/inventory/export-csv', { params });
    return res.data;
  },
  getKpi: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PagedResponse<InventoryKpiResponse>>>('/api/reports/kpi', { params });
    return res.data;
  },
  getAbcAnalysis: async (params: any) => {
    // Backend returns IReadOnlyCollection<AbcAnalysisResponse> wrapped in ApiResponse
    const res = await httpClient.get<any, ApiResponse<AbcAnalysisResponse[]>>('/api/reports/abc-analysis', { params });
    return res.data;
  }
};
