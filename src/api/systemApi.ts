import httpClient from './httpClient';
import type { User, AuditLog, SystemSetting, Notification, UpdateSystemSettingRequest } from '@/types/system';
import type { ApiResponse, PaginatedData } from '@/types/common';

export const systemApi = {
  getUsers: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<User>>>('/api/users', { params });
    return res.data;
  },

  createUser: async (data: Partial<User>) => {
    const res = await httpClient.post<any, ApiResponse<number>>('/api/users', data);
    return res;
  },

  updateUser: async (id: number, data: Partial<User>) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/users/${id}`, data);
    return res;
  },

  lockUser: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/users/${id}/lock`);
    return res;
  },

  unlockUser: async (id: number) => {
    const res = await httpClient.post<any, ApiResponse<boolean>>(`/api/users/${id}/unlock`);
    return res;
  },

  getAuditLogs: async (params: any) => {
    const res = await httpClient.get<any, ApiResponse<PaginatedData<AuditLog>>>('/api/system/audit-logs', { params });
    return res.data;
  },

  getSettings: async () => {
    const res = await httpClient.get<any, ApiResponse<SystemSetting[]>>('/api/system/settings');
    return res.data;
  },

  updateSetting: async (key: string, data: UpdateSystemSettingRequest) => {
    const res = await httpClient.put<any, ApiResponse<SystemSetting>>(`/api/system/settings/${key}`, data);
    return res.data;
  },

  getNotifications: async (params?: { isRead?: boolean }) => {
    const res = await httpClient.get<any, ApiResponse<Notification[]>>('/api/system/notifications', { params });
    return res.data;
  },

  markNotificationRead: async (id: number) => {
    const res = await httpClient.put<any, ApiResponse<boolean>>(`/api/system/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await httpClient.put<any, ApiResponse<boolean>>('/api/system/notifications/read-all');
    return res.data;
  },
};
