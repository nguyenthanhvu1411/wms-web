export interface User {
  id: number;
  userName: string;
  email: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  isLocked: boolean;
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
