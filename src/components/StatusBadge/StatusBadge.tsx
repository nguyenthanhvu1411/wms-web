import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'Draft' | 'Submitted' | 'Approved' | 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Passed' | 'Failed' | 'Partial' | 'OnHold' | 'Delivered' | 'Active' | 'Inactive' | 'Locked' | 'Full';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  Submitted: { label: 'Đã gửi duyệt', className: 'bg-info/10 text-info border-info/20' },
  Approved: { label: 'Đã duyệt', className: 'bg-success/10 text-success border-success/20' },
  Pending: { label: 'Chờ xử lý', className: 'bg-warning/10 text-warning border-warning/20' },
  InProgress: { label: 'Đang xử lý', className: 'bg-primary/10 text-primary border-primary/20' },
  Completed: { label: 'Hoàn tất', className: 'bg-success/10 text-success border-success/20' },
  Cancelled: { label: 'Đã hủy', className: 'bg-danger/10 text-danger border-danger/20' },
  Passed: { label: 'Đạt', className: 'bg-success/10 text-success border-success/20' },
  Failed: { label: 'Không đạt', className: 'bg-danger/10 text-danger border-danger/20' },
  Partial: { label: 'Một phần', className: 'bg-info/10 text-info border-info/20' },
  OnHold: { label: 'Tạm giữ', className: 'bg-warning/10 text-warning border-warning/20' },
  Delivered: { label: 'Đã giao', className: 'bg-success/10 text-success border-success/20' },
  Active: { label: 'Đang hoạt động', className: 'bg-success/10 text-success border-success/20' },
  Inactive: { label: 'Ngừng hoạt động', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  Locked: { label: 'Đã khóa', className: 'bg-danger/10 text-danger border-danger/20' },
  Full: { label: 'Đã đầy', className: 'bg-warning/10 text-warning border-warning/20' }
};

export const StatusBadge = ({ status, className, text }: { status: string; className?: string, text?: string }) => {
  const config = statusConfig[status as StatusType] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className, className)}>
      {text || config.label}
    </span>
  );
};
