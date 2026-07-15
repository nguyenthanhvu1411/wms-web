import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi, type CompletePutawayTaskRequest } from '@/api/inboundApi';
import { inboundKeys } from '@/api/queryKeys';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ArrowLeft, CheckCircle, Package, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { putawayStatusLabel, PutawayStatus } from '@/types/wms-enums';

const PutawayTaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qtyPutaway, setQtyPutaway] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [putawaySerialsStr, setPutawaySerialsStr] = useState('');

  const { data: task, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.putawayTasks, id],
    queryFn: () => inboundApi.getPutawayTaskById(Number(id)),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: (data: CompletePutawayTaskRequest) => inboundApi.completePutawayTask(Number(id), data),
    onSuccess: () => {
      toast.success('Đã hoàn tất cất hàng');
      queryClient.invalidateQueries({ queryKey: [...inboundKeys.putawayTasks, id] });
      queryClient.invalidateQueries({ queryKey: inboundKeys.putawayTasks });
      queryClient.invalidateQueries({ queryKey: inboundKeys.goodsReceipts });
      queryClient.invalidateQueries({ queryKey: ['stockBalances'] });
      queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      console.error('API Error:', error.response?.data || error);
      toast.error(error.response?.data?.error || error.response?.data?.title || error.message || 'Lỗi khi hoàn tất cất hàng');
    }
  });

  const isPending = task?.status === PutawayStatus.Pending || task?.status === PutawayStatus.InProgress;

  useEffect(() => {
    if (task && isPending) {
      setQtyPutaway(task.qtyToPutaway);
    }
  }, [task, isPending]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">Không tìm thấy task hoặc có lỗi xảy ra.</p>
        <button onClick={() => navigate('/inbound/putaway-tasks')} className="text-primary hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }



  const handleComplete = () => {
    if (qtyPutaway <= 0) {
      toast.error('Số lượng cất hàng phải lớn hơn 0');
      return;
    }
    let putawaySerials: string[] = [];
    if (task?.trackSerialNumber) {
       putawaySerials = putawaySerialsStr
         ? putawaySerialsStr.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
         : [];
       
       if (putawaySerials.length !== qtyPutaway) {
          toast.error(`Số lượng Serial nhập vào (${putawaySerials.length}) không khớp với số lượng cần cất (${qtyPutaway})`);
          return;
       }
    }

    completeMutation.mutate({ qtyPutaway, notes, serialNumbers: putawaySerials } as any);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/inbound/putaway-tasks')}
          className="p-2 hover:bg-background-hover rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              Task: {task.taskNumber}
            </h1>
            <StatusBadge status={putawayStatusLabel[task.status as PutawayStatus] || 'Unknown'} />
          </div>
          <p className="text-text-secondary mt-1">
            Từ phiếu nhận hàng: {task.grNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Package size={18} className="text-primary" />
            Thông tin sản phẩm
          </h3>
          <div className="space-y-4">
            <div>
              <span className="block text-sm text-text-secondary">Sản phẩm</span>
              <span className="font-medium text-text-primary block mt-1">{task.productName}</span>
              <span className="text-sm text-text-secondary">{task.productSku}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-text-secondary">Số lượng yêu cầu</span>
                <span className="font-medium text-primary text-lg mt-1 block">
                  {new Intl.NumberFormat('vi-VN').format(task.qtyToPutaway)}
                </span>
              </div>
              {task.lotNumber && (
                <div>
                  <span className="block text-sm text-text-secondary">Lô (Lot)</span>
                  <span className="font-medium text-text-primary block mt-1">{task.lotNumber}</span>
                </div>
              )}
            </div>
            
            {task.trackSerialNumber && (
              <div className="mt-4 pt-4 border-t border-border/50">
                 <span className="block text-sm text-text-secondary mb-2">Các số Serial chờ cất:</span>
                 <div className="text-sm text-text-primary max-h-32 overflow-y-auto bg-background p-2 rounded border border-border">
                    {(task as any).serialNumbers?.join(', ') || 'Không có serial'}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
            <MapPin size={18} className="text-primary" />
            Thông tin vị trí
          </h3>
          <div className="space-y-4">
            <div>
              <span className="block text-sm text-text-secondary">Từ vị trí (Nguồn)</span>
              <span className="font-medium text-text-primary block mt-1">{task.sourceLocationCode}</span>
            </div>
            <div>
              <span className="block text-sm text-text-secondary">Đến vị trí (Đích)</span>
              <span className="font-bold text-success text-lg block mt-1">{task.destinationLocationCode}</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:col-span-2">
          <h3 className="font-semibold text-text-primary mb-4 border-b border-border pb-2">
            Xác nhận cất hàng
          </h3>
          
          {isPending ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Số lượng thực tế đã cất <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={qtyPutaway}
                    onChange={(e) => setQtyPutaway(Number(e.target.value))}
                    disabled={task.trackSerialNumber}
                    className="w-full px-4 py-2 bg-white border border-border rounded-lg text-lg font-medium text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100"
                  />
                </div>
                
                {task.trackSerialNumber && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Nhập số Serial cất đi (phẩy/xuống dòng) <span className="text-error">*</span>
                    </label>
                    <textarea
                      value={putawaySerialsStr}
                      onChange={(e) => {
                         setPutawaySerialsStr(e.target.value);
                         const arr = e.target.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                         setQtyPutaway(arr.length);
                      }}
                      className="w-full px-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[60px]"
                      placeholder="Serial1, Serial2..."
                      rows={3}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Ghi chú thêm (nếu có)..."
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  <CheckCircle size={18} />
                  Hoàn tất thao tác
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary block">Số lượng đã cất</span>
                  <span className="font-medium text-text-primary block mt-1">
                    {new Intl.NumberFormat('vi-VN').format(task.qtyPutaway)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Trạng thái</span>
                  <span className="block mt-1">
                     <StatusBadge status={putawayStatusLabel[task.status as PutawayStatus] || 'Unknown'} />
                  </span>
                </div>
                {task.notes && (
                  <div className="col-span-2">
                    <span className="text-text-secondary block">Ghi chú</span>
                    <span className="text-text-primary block mt-1">{task.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PutawayTaskDetailPage;
