import httpClient from './httpClient';
import type { User, AuditLog, SystemSetting } from '@/types/system';
import type { ApiResponse, PaginatedData } from '@/types/common';

export const systemApi = {
  getUsers: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<User>>>('/api/users', { params });
    return res.data;
  },

  getAuditLogs: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<AuditLog>>>('/api/system/audit-logs', { params });
    return res.data;
  },

  getSettings: async () => {
    const res = await httpClient.get<any, ApiResponse<SystemSetting[]>>('/api/system/settings');
    return res.data;
  },
};
