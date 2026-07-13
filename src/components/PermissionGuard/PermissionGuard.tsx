import React from 'react';
import { useAuthStore } from '@/store/authStore';

interface PermissionGuardProps {
  permissions: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}) => {
  const { user } = useAuthStore();

  if (!user) return <>{fallback}</>;

  // Role 1 = Admin, always full access
  if (user.role === 1) return <>{children}</>;

  const userPermissions = user.permissions || [];
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  const hasPermission = requireAll
    ? requiredPermissions.every((p) => userPermissions.includes(p))
    : requiredPermissions.some((p) => userPermissions.includes(p));

  if (!hasPermission) return <>{fallback}</>;

  return <>{children}</>;
};
