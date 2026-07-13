import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '@/api/operationsApi';
import { message } from 'antd';
import { operationsKeys } from '@/api/queryKeys';

// Helper: extract error message from API response
const getErrorMessage = (error: any, fallback: string): string => {
  if (error.response?.data) {
    const data = error.response.data;
    if (data.message) return data.message;
    if (data.title && data.errors) {
      const validationErrors = Object.values(data.errors).flat().join(', ');
      return validationErrors || data.title;
    }
    if (typeof data === 'string') return data;
  }
  return error.message || fallback;
};

// ─── Queries ───────────────────────────────────────────────────────────────

export const useTransfers = (params?: any) => {
  return useQuery({
    queryKey: [...operationsKeys.transfers, params],
    queryFn: () => operationsApi.getTransfers(params),
  });
};

export const useTransfer = (id: number) => {
  return useQuery({
    queryKey: operationsKeys.transfer(id),
    queryFn: () => operationsApi.getTransfer(id),
    enabled: !!id,
  });
};

// ─── Mutations ─────────────────────────────────────────────────────────────

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: operationsApi.createTransfer,
    onSuccess: () => {
      message.success('Tạo phiếu chuyển kho thành công');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi tạo phiếu chuyển kho'));
    },
  });
};

export const useSubmitTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => operationsApi.submitTransfer(id),
    onSuccess: (_data, variables) => {
      message.success('Đã gửi phiếu chuyển kho chờ duyệt');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi gửi phiếu chuyển kho'));
    },
  });
};

export const useApproveTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => operationsApi.approveTransfer(id),
    onSuccess: (_data, variables) => {
      message.success('Đã duyệt phiếu chuyển kho');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi duyệt phiếu chuyển kho'));
    },
  });
};

export const useStartPicking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      operationsApi.startPicking(id),
    onSuccess: (_data, variables) => {
      message.success('Đã bắt đầu lấy hàng');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi bắt đầu lấy hàng'));
    },
  });
};

export const useConfirmPicking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      operationsApi.confirmPicking(id, data),
    onSuccess: (_data, variables) => {
      message.success('Đã xác nhận lấy hàng');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi xác nhận lấy hàng'));
    },
  });
};

export const useDispatchTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      operationsApi.dispatchTransfer(id),
    onSuccess: (_data, variables) => {
      message.success('Đã xuất kho và gửi hàng đi');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi xuất kho'));
    },
  });
};

export const useMarkInTransit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      operationsApi.markInTransitTransfer(id, data),
    onSuccess: (_data, variables) => {
      message.success('Đã cập nhật trạng thái đang vận chuyển');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi cập nhật trạng thái vận chuyển'));
    },
  });
};

export const useStartReceivingTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      operationsApi.startReceivingTransfer(id),
    onSuccess: (_data, variables) => {
      message.success('Đã cập nhật trạng thái đang nhận hàng');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi cập nhật trạng thái nhận hàng'));
    },
  });
};

export const useReceiveTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      operationsApi.receiveTransfer(id, data),
    onSuccess: (_data, variables) => {
      message.success('Đã xác nhận nhận hàng');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi xác nhận nhận hàng'));
    },
  });
};

export const useRejectTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      operationsApi.rejectTransfer(id, data),
    onSuccess: (_data, variables) => {
      message.success('Đã từ chối phiếu chuyển kho');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi từ chối phiếu chuyển kho'));
    },
  });
};

export const useCancelTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      operationsApi.cancelTransfer(id),
    onSuccess: (_data, variables) => {
      message.success('Đã hủy phiếu chuyển kho');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi hủy phiếu chuyển kho'));
    },
  });
};

export const useCompleteTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => operationsApi.completeTransfer(id),
    onSuccess: (_data, variables) => {
      message.success('Đã hoàn thành phiếu chuyển kho');
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfers });
      queryClient.invalidateQueries({ queryKey: operationsKeys.transfer(variables.id) });
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error, 'Lỗi khi hoàn thành phiếu chuyển kho'));
    },
  });
};
