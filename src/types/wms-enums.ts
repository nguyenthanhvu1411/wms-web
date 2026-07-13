export const PurchaseOrderStatus = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  PartiallyReceived: 4,
  FullyReceived: 5,
  Closed: 6,
  Cancelled: 7,
} as const;

export type PurchaseOrderStatus = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

export const purchaseOrderStatusLabel: Record<number, string> = {
  [PurchaseOrderStatus.Draft]: 'Nháp',
  [PurchaseOrderStatus.Submitted]: 'Đã gửi duyệt',
  [PurchaseOrderStatus.Approved]: 'Đã duyệt',
  [PurchaseOrderStatus.PartiallyReceived]: 'Nhận một phần',
  [PurchaseOrderStatus.FullyReceived]: 'Đã nhận đủ',
  [PurchaseOrderStatus.Closed]: 'Đã đóng',
  [PurchaseOrderStatus.Cancelled]: 'Đã hủy',
};

export const AsnStatus = {
  Pending: 1,
  InTransit: 2,
  Arrived: 3,
  Processed: 4,
  Cancelled: 5,
  Confirmed: 6,
} as const;

export type AsnStatus = typeof AsnStatus[keyof typeof AsnStatus];

export const asnStatusLabel: Record<number, string> = {
  [AsnStatus.Pending]: 'Chờ xử lý',
  [AsnStatus.InTransit]: 'Đang giao',
  [AsnStatus.Arrived]: 'Đã đến',
  [AsnStatus.Processed]: 'Đã xử lý',
  [AsnStatus.Cancelled]: 'Đã hủy',
  [AsnStatus.Confirmed]: 'Đã xác nhận',
};

export const GoodsReceiptStatus = {
  Draft: 1,
  InProgress: 2,
  QCPending: 3,
  QCPassed: 4,
  QCFailed: 5,
  Completed: 6,
  Cancelled: 7,
  PendingPutaway: 8
} as const;

export type GoodsReceiptStatus = typeof GoodsReceiptStatus[keyof typeof GoodsReceiptStatus];

export const goodsReceiptStatusLabel: Record<number, string> = {
  [GoodsReceiptStatus.Draft]: 'Nháp',
  [GoodsReceiptStatus.InProgress]: 'Đang xử lý',
  [GoodsReceiptStatus.QCPending]: 'Chờ QC',
  [GoodsReceiptStatus.QCPassed]: 'QC Đạt',
  [GoodsReceiptStatus.QCFailed]: 'QC Lỗi',
  [GoodsReceiptStatus.Completed]: 'Đã hoàn thành',
  [GoodsReceiptStatus.Cancelled]: 'Đã hủy',
  [GoodsReceiptStatus.PendingPutaway]: 'Chờ cất hàng',
};

export const QualityCheckStatus = {
  Pending: 1,
  InProgress: 2,
  Completed: 3,
  Cancelled: 4,
} as const;

export type QualityCheckStatus = typeof QualityCheckStatus[keyof typeof QualityCheckStatus];

export const qualityCheckStatusLabel: Record<number, string> = {
  [QualityCheckStatus.Pending]: 'Chờ kiểm tra',
  [QualityCheckStatus.InProgress]: 'Đang kiểm tra',
  [QualityCheckStatus.Completed]: 'Đã kiểm tra',
  [QualityCheckStatus.Cancelled]: 'Đã hủy',
};

export const QualityCheckResult = {
  Pending: 1,
  Passed: 2,
  Failed: 3,
  Partial: 4,
} as const;

export type QualityCheckResult = typeof QualityCheckResult[keyof typeof QualityCheckResult];

export const qualityCheckResultLabel: Record<number, string> = {
  [QualityCheckResult.Pending]: 'Chờ xử lý',
  [QualityCheckResult.Passed]: 'Đạt',
  [QualityCheckResult.Failed]: 'Không đạt',
  [QualityCheckResult.Partial]: 'Đạt một phần',
};

export const PutawayStatus = {
  Pending: 1,
  InProgress: 2,
  Completed: 3,
  Cancelled: 4,
} as const;

export type PutawayStatus = typeof PutawayStatus[keyof typeof PutawayStatus];

export const putawayStatusLabel: Record<number, string> = {
  [PutawayStatus.Pending]: 'Chờ cất hàng',
  [PutawayStatus.InProgress]: 'Đang cất',
  [PutawayStatus.Completed]: 'Đã cất',
  [PutawayStatus.Cancelled]: 'Đã hủy',
};

export const SalesOrderStatus = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  Released: 4,
  Picking: 5,
  Picked: 6,
  Packing: 7,
  PartiallyShipped: 8,
  Shipped: 9,
  Delivered: 10,
  Cancelled: 11,
  OnHold: 12,
  Closed: 13,
  Allocated: 14,
} as const;

export type SalesOrderStatus = typeof SalesOrderStatus[keyof typeof SalesOrderStatus];

export const salesOrderStatusLabel: Record<number, string> = {
  [SalesOrderStatus.Draft]: 'Nháp',
  [SalesOrderStatus.Submitted]: 'Đã gửi',
  [SalesOrderStatus.Approved]: 'Đã duyệt',
  [SalesOrderStatus.Released]: 'Đã phát hành',
  [SalesOrderStatus.Allocated]: 'Đã cấp phát',
  [SalesOrderStatus.Picking]: 'Đang nhặt hàng',
  [SalesOrderStatus.Picked]: 'Đã nhặt xong',
  [SalesOrderStatus.Packing]: 'Đang đóng gói',
  [SalesOrderStatus.PartiallyShipped]: 'Giao một phần',
  [SalesOrderStatus.Shipped]: 'Đã giao',
  [SalesOrderStatus.Delivered]: 'Đã giao đến khách',
  [SalesOrderStatus.Cancelled]: 'Đã hủy',
  [SalesOrderStatus.OnHold]: 'Tạm giữ',
  [SalesOrderStatus.Closed]: 'Đã đóng'
};

export const TransferStatus = {
  Draft: 1,
  Approved: 2,
  InProgress: 3,    // Legacy
  Completed: 4,
  Cancelled: 5,
  Submitted: 6,     // GửI duyệt
  Picking: 7,       // Đang nhặt hàng
  InTransit: 8,     // Đang vận chuyển
  Receiving: 9,     // Đang nhận hàng
  Rejected: 10,     // Bị từ chối
  Dispatched: 11    // Đã xuất kho
} as const;

export type TransferStatus = typeof TransferStatus[keyof typeof TransferStatus];

export const transferStatusLabel: Record<number, string> = {
  [TransferStatus.Draft]: 'Nháp',
  [TransferStatus.Submitted]: 'Đã gửI duyệt',
  [TransferStatus.Approved]: 'Đã duyệt',
  [TransferStatus.Picking]: 'Đang nhặt hàng',
  [TransferStatus.InProgress]: 'Đang chuyển',
  [TransferStatus.InTransit]: 'Đang vận chuyển',
  [TransferStatus.Receiving]: 'Đang nhận hàng',
  [TransferStatus.Completed]: 'Hoàn tất',
  [TransferStatus.Rejected]: 'Bị từ chối',
  [TransferStatus.Cancelled]: 'Đã hủy',
  [TransferStatus.Dispatched]: 'Đã xuất kho'
};

export const TransferPriority = {
  Low: 1,
  Normal: 2,
  High: 3,
  Urgent: 4,
} as const;

export type TransferPriority = typeof TransferPriority[keyof typeof TransferPriority];

export const transferPriorityLabel: Record<number, string> = {
  [TransferPriority.Low]: 'Thấp',
  [TransferPriority.Normal]: 'Bình thường',
  [TransferPriority.High]: 'Cao',
  [TransferPriority.Urgent]: 'Khẩn cấp',
};

export const transferPriorityColor: Record<number, string> = {
  [TransferPriority.Low]: 'default',
  [TransferPriority.Normal]: 'blue',
  [TransferPriority.High]: 'orange',
  [TransferPriority.Urgent]: 'red',
};

export const CycleCountStatus = {
  Draft: 1,
  Approved: 2,
  Counting: 3,
  CompletedCount: 4,
  ReviewDifference: 5,
  AdjustInventory: 6,
  Completed: 7,
  Cancelled: 8,
} as const;

export type CycleCountStatus = typeof CycleCountStatus[keyof typeof CycleCountStatus];

export const cycleCountStatusLabel: Record<number, string> = {
  [CycleCountStatus.Draft]: 'Khởi tạo (Draft)',
  [CycleCountStatus.Approved]: 'Đã duyệt (Approved)',
  [CycleCountStatus.Counting]: 'Đang kiểm kê (Counting)',
  [CycleCountStatus.CompletedCount]: 'Đã kiểm xong (Completed)',
  [CycleCountStatus.ReviewDifference]: 'Chờ đối chiếu (Review)',
  [CycleCountStatus.AdjustInventory]: 'Chờ điều chỉnh (Adjust)',
  [CycleCountStatus.Completed]: 'Hoàn thành',
  [CycleCountStatus.Cancelled]: 'Đã hủy',
};

export const PickingOrderStatus = {
  Pending: 1,
  Assigned: 2,
  InProgress: 3,
  Completed: 4,
  Cancelled: 5,
} as const;

export type PickingOrderStatus = typeof PickingOrderStatus[keyof typeof PickingOrderStatus];

export const pickingOrderStatusLabel: Record<number, string> = {
  [PickingOrderStatus.Pending]: 'Chờ xử lý',
  [PickingOrderStatus.Assigned]: 'Đã giao việc',
  [PickingOrderStatus.InProgress]: 'Đang nhặt hàng',
  [PickingOrderStatus.Completed]: 'Hoàn tất nhặt hàng',
  [PickingOrderStatus.Cancelled]: 'Đã hủy',
};




export const ShippingPackageStatus = {
  Packing: 1,
  Packed: 2,
  LabelPrinted: 3,
  Dispatched: 4,
  InTransit: 5,
  Delivered: 6,
  Returned: 7,
} as const;

export type ShippingPackageStatus = typeof ShippingPackageStatus[keyof typeof ShippingPackageStatus];

export const shippingPackageStatusLabel: Record<number, string> = {
  [ShippingPackageStatus.Packing]: 'Đang đóng gói',
  [ShippingPackageStatus.Packed]: 'Đã đóng gói',
  [ShippingPackageStatus.LabelPrinted]: 'Đã in nhãn',
  [ShippingPackageStatus.Dispatched]: 'Đã bàn giao vận chuyển',
  [ShippingPackageStatus.InTransit]: 'Đang vận chuyển',
  [ShippingPackageStatus.Delivered]: 'Đã giao thành công',
  [ShippingPackageStatus.Returned]: 'Đã trả hàng',
};

export const statusColorMap: Record<string, string> = {
  draft: 'default',
  pending: 'default',
  submitted: 'processing',
  inProgress: 'processing',
  picking: 'processing',
  inTransit: 'warning',
  receiving: 'warning',
  approved: 'success',
  completed: 'success',
  adjusted: 'success',
  failed: 'error',
  rejected: 'error',
  cancelled: 'error',
  partial: 'warning',
};

export const ReturnStatus = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  Receiving: 4,
  QC: 5,
  Disposition: 6,
  Putaway: 7,
  Completed: 8,
  Closed: 9,
  Rejected: 10,
  WaitingRefund: 11,
  Refunded: 12,
  Cancelled: 13,
} as const;

export type ReturnStatus = typeof ReturnStatus[keyof typeof ReturnStatus];

export const returnStatusLabel: Record<number, string> = {
  [ReturnStatus.Draft]: 'Nháp',
  [ReturnStatus.Submitted]: 'Đã gửi duyệt',
  [ReturnStatus.Approved]: 'Đã duyệt',
  [ReturnStatus.Receiving]: 'Đang nhận',
  [ReturnStatus.QC]: 'Đang QC',
  [ReturnStatus.Disposition]: 'Xử lý lỗi',
  [ReturnStatus.Putaway]: 'Cất hàng',
  [ReturnStatus.Completed]: 'Hoàn tất',
  [ReturnStatus.Closed]: 'Đã đóng',
  [ReturnStatus.Rejected]: 'Bị từ chối',
  [ReturnStatus.WaitingRefund]: 'Chờ hoàn tiền',
  [ReturnStatus.Refunded]: 'Đã hoàn tiền',
  [ReturnStatus.Cancelled]: 'Đã hủy',
};

export const ReturnToVendorStatus = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  Shipped: 4,
  Completed: 5,
  Cancelled: 6,
} as const;

export type ReturnToVendorStatus = typeof ReturnToVendorStatus[keyof typeof ReturnToVendorStatus];

export const returnToVendorStatusLabel: Record<number, string> = {
  [ReturnToVendorStatus.Draft]: 'Nháp',
  [ReturnToVendorStatus.Submitted]: 'Đã gửi duyệt',
  [ReturnToVendorStatus.Approved]: 'Đã duyệt',
  [ReturnToVendorStatus.Shipped]: 'Đã vận chuyển',
  [ReturnToVendorStatus.Completed]: 'Hoàn thành',
  [ReturnToVendorStatus.Cancelled]: 'Đã hủy',
};

export const PickingStrategy = {
  FIFO: 1,
  FEFO: 2,
  LIFO: 3,
  Priority: 4,
} as const;

export type PickingStrategy = typeof PickingStrategy[keyof typeof PickingStrategy];

export const VendorInvoiceStatus = {
  Draft: 1,
  Submitted: 2,
  Matched: 3,
  Mismatched: 4,
  Approved: 5,
  PaymentRequested: 6,
  Paid: 7,
  Closed: 8,
} as const;

export type VendorInvoiceStatus = typeof VendorInvoiceStatus[keyof typeof VendorInvoiceStatus];

export const vendorInvoiceStatusLabel: Record<number, string> = {
  [VendorInvoiceStatus.Draft]: 'Nháp',
  [VendorInvoiceStatus.Submitted]: 'Đã gửi',
  [VendorInvoiceStatus.Matched]: 'Khớp',
  [VendorInvoiceStatus.Mismatched]: 'Lệch',
  [VendorInvoiceStatus.Approved]: 'Đã duyệt',
  [VendorInvoiceStatus.PaymentRequested]: 'Đã Y/C T.Toán',
  [VendorInvoiceStatus.Paid]: 'Đã T.Toán',
  [VendorInvoiceStatus.Closed]: 'Đã đóng',
};

export const PaymentRequestStatus = {
  Draft: 1,
  PendingApproval: 2,
  Approved: 3,
  Paid: 4,
  Cancelled: 5,
  Rejected: 6
} as const;

export type PaymentRequestStatus = typeof PaymentRequestStatus[keyof typeof PaymentRequestStatus];

export const paymentRequestStatusLabel: Record<number, string> = {
  [PaymentRequestStatus.Draft]: 'Nháp',
  [PaymentRequestStatus.PendingApproval]: 'Chờ duyệt',
  [PaymentRequestStatus.Approved]: 'Đã duyệt',
  [PaymentRequestStatus.Paid]: 'Đã thanh toán',
  [PaymentRequestStatus.Cancelled]: 'Đã hủy',
  [PaymentRequestStatus.Rejected]: 'Từ chối'
};
