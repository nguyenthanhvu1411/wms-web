export const inboundKeys = {
  purchaseOrders: ['inbound', 'purchase-orders'],
  purchaseOrder: (id: number) => ['inbound', 'purchase-orders', id],
  asns: ['inbound', 'asns'],
  asn: (id: number) => ['inbound', 'asns', id],
  goodsReceipts: ['inbound', 'goods-receipts'],
  goodsReceipt: (id: number) => ['inbound', 'goods-receipts', id],
  qualityChecks: ['inbound', 'quality-checks'],
  qualityCheck: (id: number) => ['inbound', 'quality-checks', id],
  putawayTasks: ['inbound', 'putaway-tasks'],
  putawayTask: (id: number) => ['inbound', 'putaway-tasks', id],
};

export const masterDataKeys = {
  suppliers: ['suppliers'],
  warehouses: ['warehouses'],
  locations: ['locations'],
  products: ['products'],
  categories: ['categories'],
  uoms: ['uoms'],
};

export const stockKeys = {
  balances: ['stock', 'balances'],
  transactions: ['stock', 'transactions'],
};

export const outboundKeys = {
  salesOrders: ['outbound', 'sales-orders'],
  salesOrder: (id: number) => ['outbound', 'sales-orders', id],
  pickingTasks: ['outbound', 'picking-tasks'],
  pickingTask: (id: number) => ['outbound', 'picking-tasks', id],
  shipments: ['outbound', 'shipments'],
};

export const operationsKeys = {
  cycleCounts: ['operations', 'cycle-counts'],
  cycleCount: (id: number) => ['operations', 'cycle-counts', id],
  transfers: ['operations', 'transfers'],
  transfer: (id: number) => ['operations', 'transfers', id],
};

export const returnsKeys = {
  customer: {
    list: (params?: any) => ['returns', 'customer', 'list', params],
    detail: (id: number) => ['returns', 'customer', 'detail', id],
  },
  vendor: {
    list: (params?: any) => ['returns', 'vendor', 'list', params],
    detail: (id: number) => ['returns', 'vendor', 'detail', id],
  }
};
