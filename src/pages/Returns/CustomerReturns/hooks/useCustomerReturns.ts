import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '@/api/operationsApi';
import { message } from 'antd';
import { returnsKeys } from '@/api/queryKeys';
import type { 
  ReturnOrderQueryRequest, 
  CreateReturnOrderRequest, 
  ReceiveReturnOrderRequest, 
  InspectReturnOrderRequest 
} from '@/types/operations';

export const useCustomerReturns = (params?: ReturnOrderQueryRequest) => {
  return useQuery({
    queryKey: returnsKeys.customer.list(params),
    queryFn: () => operationsApi.getCustomerReturns(params),
  });
};

export const useCustomerReturn = (id: number) => {
  return useQuery({
    queryKey: returnsKeys.customer.detail(id),
    queryFn: () => operationsApi.getCustomerReturnById(id),
    enabled: !!id,
  });
};

export const useCreateCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnOrderRequest) => operationsApi.createReturnOrder(data),
    onSuccess: () => {
      message.success('Tạo phiếu hoàn trả thành công');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi tạo phiếu hoàn trả');
    },
  });
};

export const useSubmitCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.submitReturnOrder(id),
    onSuccess: (data, id) => {
      message.success('Đã gửi duyệt phiếu hoàn trả');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi gửi duyệt phiếu hoàn trả');
    },
  });
};

export const useApproveCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.approveReturnOrder(id),
    onSuccess: (data, id) => {
      message.success('Đã phê duyệt phiếu hoàn trả');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi phê duyệt phiếu hoàn trả');
    },
  });
};

export const useRejectCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      operationsApi.rejectReturnOrder(id, reason),
    onSuccess: (data, variables) => {
      message.success('Đã từ chối phiếu hoàn trả');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(variables.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi từ chối phiếu hoàn trả');
    },
  });
};

export const useCancelCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.cancelReturnOrder(id),
    onSuccess: (data, id) => {
      message.success('Đã hủy phiếu hoàn trả');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi hủy phiếu hoàn trả');
    },
  });
};

export const useReceiveCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReceiveReturnOrderRequest }) => 
      operationsApi.receiveReturnOrder(id, data),
    onSuccess: (data, variables) => {
      message.success('Đã ghi nhận số lượng nhận hàng');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(variables.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi nhận hàng');
    },
  });
};

export const useInspectCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InspectReturnOrderRequest }) => 
      operationsApi.inspectReturnOrder(id, data),
    onSuccess: (data, variables) => {
      message.success('Đã hoàn tất quá trình kiểm tra chất lượng (QC)');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(variables.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi kiểm tra chất lượng');
    },
  });
};

export const useCompleteCustomerReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.completeReturnOrder(id),
    onSuccess: (data, id) => {
      message.success('Đã đóng phiếu hoàn trả');
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.customer.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi hoàn thành phiếu');
    },
  });
};
