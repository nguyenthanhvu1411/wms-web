import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { message } from 'antd';
import { returnsKeys } from '@/api/queryKeys';

export const useVendorReturns = (params?: any) => {
  return useQuery({
    queryKey: returnsKeys.vendor.list(params),
    queryFn: () => inboundApi.getVendorReturns(params),
  });
};

export const useVendorReturn = (id: number) => {
  return useQuery({
    queryKey: returnsKeys.vendor.detail(id),
    queryFn: () => inboundApi.getVendorReturnById(id),
    enabled: !!id,
  });
};

export const useCreateVendorReturnFromQc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inboundApi.createVendorReturnFromQc,
    onSuccess: () => {
      message.success('Tạo phiếu trả nhà cung cấp thành công');
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.list() });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi tạo phiếu trả NCC');
    },
  });
};

export const useSubmitVendorReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inboundApi.submitVendorReturn(id),
    onSuccess: (data, id) => {
      message.success('Đã gửi phiếu trả NCC');
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi gửi phiếu trả NCC');
    },
  });
};

export const useApproveVendorReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inboundApi.approveVendorReturn(id),
    onSuccess: (data, id) => {
      message.success('Đã duyệt phiếu trả NCC');
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi duyệt phiếu trả NCC');
    },
  });
};

export const useShipVendorReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: import('@/types/inbound').ShipReturnToVendorRequest }) => inboundApi.shipVendorReturn(id, data),
    onSuccess: (data, variables) => {
      message.success('Đã xác nhận xuất kho trả NCC');
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.detail(variables.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi xử lý trả NCC');
    },
  });
};

export const useCancelVendorReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inboundApi.cancelVendorReturn(id),
    onSuccess: (data, id) => {
      message.success('Đã hủy phiếu trả NCC');
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi hủy phiếu trả NCC');
    },
  });
};

export const useCompleteVendorReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inboundApi.completeVendorReturn(id),
    onSuccess: (data, id) => {
      message.success('Đã hoàn thành phiếu trả NCC');
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.list() });
      queryClient.invalidateQueries({ queryKey: returnsKeys.vendor.detail(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi hoàn thành phiếu trả NCC');
    },
  });
};
