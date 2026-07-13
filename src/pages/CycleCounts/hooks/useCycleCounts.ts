import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '@/api/operationsApi';
import { message } from 'antd';
import { operationsKeys } from '@/api/queryKeys';

export const useCycleCounts = (params?: any) => {
  return useQuery({
    queryKey: [...operationsKeys.cycleCounts, params],
    queryFn: () => operationsApi.getCycleCounts(params),
  });
};

export const useCycleCountDashboard = () => {
  return useQuery({
    queryKey: ['cycleCounts', 'dashboard'],
    queryFn: () => operationsApi.getCycleCountDashboard(),
  });
};

export const useCycleCount = (id: number) => {
  return useQuery({
    queryKey: operationsKeys.cycleCount(id),
    queryFn: () => operationsApi.getCycleCount(id),
    enabled: !!id,
  });
};

export const useCreateCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsApi.createCycleCount,
    onSuccess: () => {
      message.success('Lên lịch kiểm kê thành công');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi tạo lịch kiểm kê');
    },
  });
};

export const useUpdateCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => operationsApi.updateCycleCount(id, data),
    onSuccess: (data, variables) => {
      message.success('Cập nhật phiếu kiểm kê thành công');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(variables.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi cập nhật phiếu kiểm kê');
    },
  });
};

export const useCountCycleCountLine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cycleCountId, lineId, data }: { cycleCountId: number; lineId: number; data: any }) => operationsApi.countCycleCountLine(lineId, data),
    onSuccess: (data, variables) => {
      message.success('Đã lưu kết quả đếm');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(variables.cycleCountId) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi lưu kết quả đếm');
    },
  });
};

export const useApproveCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.approveCycleCount(id),
    onSuccess: (data, id) => {
      message.success('Đã duyệt phiếu kiểm kê');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi duyệt phiếu kiểm kê');
    },
  });
};

export const useStartCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.startCycleCount(id),
    onSuccess: (data, id) => {
      message.success('Đã bắt đầu kiểm kê');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi bắt đầu kiểm kê');
    },
  });
};

export const useCompleteCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.completeCycleCount(id),
    onSuccess: (data, id) => {
      message.success('Đã xác nhận hoàn tất kiểm đếm');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi xác nhận kiểm đếm');
    },
  });
};

export const useReviewCycleCountDifference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.reviewCycleCountDifference(id),
    onSuccess: (data, id) => {
      message.success('Đã xác nhận đối chiếu chênh lệch');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi đối chiếu chênh lệch');
    },
  });
};

export const useAdjustCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.adjustCycleCountInventory(id),
    onSuccess: (data, id) => {
      message.success('Đã điều chỉnh tồn kho theo phiếu kiểm kê');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi điều chỉnh tồn kho');
    },
  });
};

export const useCompleteCycleCountWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.completeCycleCountWorkflow(id),
    onSuccess: (data, id) => {
      message.success('Đã đóng phiếu kiểm kê');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi đóng phiếu kiểm kê');
    },
  });
};

export const useCancelCycleCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => operationsApi.cancelCycleCount(id),
    onSuccess: (data, id) => {
      message.success('Đã hủy phiếu kiểm kê');
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCounts });
      queryClient.invalidateQueries({ queryKey: operationsKeys.cycleCount(id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Lỗi khi hủy phiếu kiểm kê');
    },
  });
};

