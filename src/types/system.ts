export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  assignedWarehouseId?: number;
  assignedWarehouseName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: string;
  userName?: string;
  action: number;
  entityName: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  occurredAt: string;
  ipAddress?: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value?: string;
  defaultValue?: string;
  dataType: string;
  description?: string;
  groupName: string;
  scope: number;
  isEditable: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Notification {
  id: number;
  uuid: string;
  userId?: number;
  title: string;
  content: string;
  type: number; // 0: Info, 1: Success, 2: Warning, 3: Error
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  referenceType?: string;
  referenceId?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface UpdateSystemSettingRequest {
  value?: string;
  description?: string;
  dataType?: string;
  scope?: number;
}
