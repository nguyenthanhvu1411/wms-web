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


export const useShippingPackages = (params?: any) => {
  return useQuery({
    queryKey: [...outboundKeys.shipments, params],
    queryFn: () => outboundApi.getShippingPackages(params),
  });
};

export const useShippingPackage = (id: number) => {
  return useQuery({
    queryKey: [...outboundKeys.shipments, id],
    queryFn: () => outboundApi.getShippingPackage(id),
    enabled: !!id,
  });
};

export const useCreateShippingPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundApi.createShippingPackage,
    onSuccess: () => {
      message.success('Đóng gói thành công');
      invalidateAll(queryClient);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi đóng gói';
      message.error(errorMsg);
    },
  });
};

export const useShipPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: any }) => outboundApi.dispatchPackage(id, data),
    onSuccess: () => {
      message.success('Đã giao hàng thành công, hệ thống đã trừ tồn kho.');
      invalidateAll(queryClient);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi cập nhật giao hàng';
      message.error(errorMsg);
    },
  });
};

export const useMarkPackageDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundApi.markPackageDelivered,
    onSuccess: () => {
      message.success('Đã xác nhận giao hàng thành công.');
      invalidateAll(queryClient);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi xác nhận giao hàng';
      message.error(errorMsg);
    },
  });
};

