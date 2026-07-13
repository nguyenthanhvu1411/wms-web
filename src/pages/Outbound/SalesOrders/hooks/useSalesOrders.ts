import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { outboundApi } from '@/api/outboundApi';
import { message } from 'antd';
import { outboundKeys, stockKeys } from '@/api/queryKeys';

const invalidateAll = (queryClient: any, salesOrderId?: number) => {
  queryClient.invalidateQueries({ queryKey: outboundKeys.salesOrders });
  if (salesOrderId) {
    queryClient.invalidateQueries({ queryKey: outboundKeys.salesOrder(salesOrderId) });
  }
  queryClient.invalidateQueries({ queryKey: outboundKeys.pickingTasks });
  queryClient.invalidateQueries({ queryKey: outboundKeys.shipments });
  queryClient.invalidateQueries({ queryKey: stockKeys.balances });
  queryClient.invalidateQueries({ queryKey: stockKeys.transactions });
};


export const useSalesOrders = (params?: any) => {
  return useQuery({
    queryKey: [...outboundKeys.salesOrders, params],
    queryFn: () => outboundApi.getSalesOrders(params),
  });
};

export const useSalesOrder = (id: number) => {
  return useQuery({
    queryKey: outboundKeys.salesOrder(id),
    queryFn: () => outboundApi.getSalesOrder(id),
    enabled: !!id,
  });
};

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundApi.createSalesOrder,
    onSuccess: () => {
      message.success('Tạo đơn bán hàng thành công');
      invalidateAll(queryClient);
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi tạo đơn bán hàng');
    },
  });
};

export const useUpdateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => outboundApi.updateSalesOrder(id, data),
    onSuccess: (data, variables) => {
      message.success('Cập nhật đơn bán hàng thành công');
      invalidateAll(queryClient, variables.id);
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi cập nhật đơn bán hàng');
    },
  });
};

export const useSubmitSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outboundApi.submitSalesOrder(id),
    onSuccess: (data, variables) => {
      message.success('Submit đơn bán hàng thành công');
      invalidateAll(queryClient, variables);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi submit đơn bán hàng'); },
  });
};

export const useApproveSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outboundApi.approveSalesOrder(id),
    onSuccess: (data, variables) => {
      message.success('Duyệt đơn bán hàng thành công');
      invalidateAll(queryClient, variables);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi duyệt đơn bán hàng'); },
  });
};

export const useRejectSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => outboundApi.rejectSalesOrder(id, reason),
    onSuccess: (data, variables) => {
      message.success('Từ chối đơn bán hàng thành công');
      invalidateAll(queryClient, variables.id);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi từ chối đơn bán hàng'); },
  });
};

export const useReleaseSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outboundApi.releaseSalesOrder(id),
    onSuccess: (data, variables) => {
      message.success('Release đơn bán hàng thành công');
      invalidateAll(queryClient, variables);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi release đơn bán hàng'); },
  });
};

export const useHoldSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => outboundApi.holdSalesOrder(id, reason),
    onSuccess: (data, variables) => {
      message.success('Đã tạm ngưng đơn bán hàng');
      invalidateAll(queryClient, variables.id);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi tạm ngưng đơn bán hàng'); },
  });
};

export const useUnHoldSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outboundApi.unHoldSalesOrder(id),
    onSuccess: (data, variables) => {
      message.success('Đã gỡ tạm ngưng đơn bán hàng');
      invalidateAll(queryClient, variables);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi gỡ tạm ngưng đơn bán hàng'); },
  });
};

export const useCancelSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outboundApi.cancelSalesOrder(id),
    onSuccess: (data, variables) => {
      message.success('Hủy đơn bán hàng thành công');
      invalidateAll(queryClient, variables);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi hủy đơn bán hàng'); },
  });
};

export const useCloseSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outboundApi.closeSalesOrder(id),
    onSuccess: (data, variables) => {
      message.success('Đóng đơn bán hàng thành công');
      invalidateAll(queryClient, variables);
    },
    onError: (error: any) => { message.error(error.message || 'Lỗi khi đóng đơn bán hàng'); },
  });
};
