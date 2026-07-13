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


export const usePickingOrders = (params?: any) => {
  return useQuery({
    queryKey: [...outboundKeys.pickingTasks, params],
    queryFn: () => outboundApi.getPickingOrders(params),
  });
};

export const usePickingOrder = (id: number) => {
  return useQuery({
    queryKey: outboundKeys.pickingTask(id),
    queryFn: () => outboundApi.getPickingOrder(id),
    enabled: !!id,
  });
};

export const useCreatePickingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: outboundApi.createPickingOrder,
    onSuccess: (data) => {
      message.success('Tạo lệnh nhặt hàng thành công');
      // data might contain salesOrderId, let's invalidate all
      invalidateAll(queryClient, data?.salesOrderId);
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi tạo lệnh nhặt hàng');
    },
  });
};

export const usePickLine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: number; data: any }) => outboundApi.pickLine(lineId, data),
    onSuccess: () => {
      message.success('Đã ghi nhận số lượng nhặt');
      invalidateAll(queryClient);
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi nhặt hàng');
    },
  });
};

export const useAssignPickingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { assignedTo?: string } }) => outboundApi.assignPickingOrder(id, data),
    onSuccess: (data) => {
      message.success('Phân công người phụ trách thành công');
      queryClient.invalidateQueries({ queryKey: outboundKeys.pickingTasks });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: outboundKeys.pickingTask(data.id) });
      }
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi phân công');
    },
  });
};
