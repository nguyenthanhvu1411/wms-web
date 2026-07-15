import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  // Generic
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
  Full: { label: 'Đã đầy', className: 'bg-warning/10 text-warning border-warning/20' },
  // GR statuses
  QCPending: { label: 'Chờ QC', className: 'bg-warning/10 text-warning border-warning/20' },
  QCPassed: { label: 'QC Đạt', className: 'bg-success/10 text-success border-success/20' },
  QCFailed: { label: 'QC Lỗi', className: 'bg-danger/10 text-danger border-danger/20' },
  PendingPutaway: { label: 'Chờ cất hàng', className: 'bg-info/10 text-info border-info/20' },
  // ASN statuses
  InTransit: { label: 'Đang giao', className: 'bg-info/10 text-info border-info/20' },
  Arrived: { label: 'Đã đến', className: 'bg-success/10 text-success border-success/20' },
  Processed: { label: 'Đã xử lý', className: 'bg-success/10 text-success border-success/20' },
  Confirmed: { label: 'Đã xác nhận', className: 'bg-success/10 text-success border-success/20' },
  // Transfer & Outbound
  Picking: { label: 'Đang nhặt hàng', className: 'bg-primary/10 text-primary border-primary/20' },
  Picked: { label: 'Đã nhặt xong', className: 'bg-success/10 text-success border-success/20' },
  Packing: { label: 'Đang đóng gói', className: 'bg-info/10 text-info border-info/20' },
  Dispatched: { label: 'Đã xuất kho', className: 'bg-success/10 text-success border-success/20' },
  Receiving: { label: 'Đang nhận', className: 'bg-info/10 text-info border-info/20' },
  Rejected: { label: 'Bị từ chối', className: 'bg-danger/10 text-danger border-danger/20' },
  Released: { label: 'Đã phát hành', className: 'bg-info/10 text-info border-info/20' },
  Allocated: { label: 'Đã cấp phát', className: 'bg-primary/10 text-primary border-primary/20' },
  PartiallyShipped: { label: 'Giao một phần', className: 'bg-warning/10 text-warning border-warning/20' },
  Shipped: { label: 'Đã giao', className: 'bg-success/10 text-success border-success/20' },
  Assigned: { label: 'Đã giao việc', className: 'bg-info/10 text-info border-info/20' },
  Closed: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  PartiallyReceived: { label: 'Nhận một phần', className: 'bg-warning/10 text-warning border-warning/20' },
  FullyReceived: { label: 'Đã nhận đủ', className: 'bg-success/10 text-success border-success/20' },
};

export const StatusBadge = ({ status, className, text }: { status: string | number; className?: string; text?: string }) => {
  const config = statusConfig[String(status)] || { label: text || String(status), className: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className, className)}>
      {text || config.label}
    </span>
  );
};
