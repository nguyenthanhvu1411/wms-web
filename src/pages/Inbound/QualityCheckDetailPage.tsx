import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { inboundApi, type CompleteQualityCheckRequest } from '@/api/inboundApi';
import { inboundKeys } from '@/api/queryKeys';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ArrowLeft, CheckCircle, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { qualityCheckResultLabel, QualityCheckResult } from '@/types/wms-enums';
import { format } from 'date-fns';

const QualityCheckDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'lines' | 'overview'>('lines');

  const { register, control, handleSubmit, reset } = useForm<CompleteQualityCheckRequest>({
    defaultValues: {
      notes: '',
      rejectReason: '',
      lines: []
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'lines'
  });

  const { data: qc, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.qualityChecks, id],
    queryFn: () => inboundApi.getQualityCheckById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (qc && qc.lines) {
      reset({
        notes: qc.notes || '',
        rejectReason: qc.rejectReason || '',
        lines: qc.lines.map(line => ({
          goodsReceiptLineId: line.goodsReceiptLineId,
          qtyInspected: line.qtyInspected,
          qtyPassed: line.qtyPassed,
          qtyFailed: line.qtyFailed,
          failureReason: line.failureReason || '',
          notes: line.notes || '',
          failedSerialsStr: line.failedSerials?.join(', ') || ''
        }))
      });
    }
  }, [qc, reset]);

  const completeMutation = useMutation({
    mutationFn: (data: CompleteQualityCheckRequest) => inboundApi.completeQualityCheck(Number(id), data),
    onSuccess: () => {
      toast.success('Đã hoàn tất phiếu QC');
      queryClient.invalidateQueries({ queryKey: [...inboundKeys.qualityChecks, id] });
      queryClient.invalidateQueries({ queryKey: inboundKeys.qualityChecks });
      queryClient.invalidateQueries({ queryKey: inboundKeys.goodsReceipts });
      queryClient.invalidateQueries({ queryKey: inboundKeys.putawayTasks });
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = data?.message || data?.error || data?.title || error.message || 'Lỗi khi hoàn tất QC';
      if (data?.errors && Object.keys(data.errors).length > 0) msg = Object.values(data.errors).flat().join('\\n');
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const onSubmit = (data: CompleteQualityCheckRequest) => {
    // Validate that passed + failed = inspected
    let hasError = false;
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      if (line.qtyPassed + line.qtyFailed !== line.qtyInspected) {
        toast.error(`Dòng ${i + 1}: Số lượng Đạt + Không Đạt phải bằng số lượng đã kiểm tra.`);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      const payload = {
        ...data,
        lines: data.lines.map((line: any) => {
          const qcLine = qc?.lines?.find((l: any) => l.goodsReceiptLineId === line.goodsReceiptLineId);
          let passedSerials: string[] = [];
          let failedSerials: string[] = [];
          
          if (qcLine?.trackSerialNumber) {
             failedSerials = line.failedSerialsStr
                ? line.failedSerialsStr.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
                : [];
             const allSerials = qcLine.serialNumbers || [];
             passedSerials = allSerials.filter((s: string) => !failedSerials.includes(s));
             line.qtyFailed = failedSerials.length;
             line.qtyPassed = passedSerials.length;
             
             if (line.qtyPassed + line.qtyFailed !== line.qtyInspected) {
                toast.error(`Dòng có Product ${qcLine.productName}: Tổng số Serial Đạt/Không đạt không khớp với số lượng kiểm tra.`);
                hasError = true;
             }
          }
          
          return {
            ...line,
            qtyInspected: isNaN(line.qtyInspected) || line.qtyInspected === null ? 0 : line.qtyInspected,
            qtyPassed: isNaN(line.qtyPassed) || line.qtyPassed === null ? 0 : line.qtyPassed,
            qtyFailed: isNaN(line.qtyFailed) || line.qtyFailed === null ? 0 : line.qtyFailed,
            failedSerials,
            passedSerials
          };
        })
      };
      
      if (!hasError) {
        completeMutation.mutate(payload);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !qc) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">Không tìm thấy phiếu QC hoặc có lỗi xảy ra.</p>
        <button onClick={() => navigate('/inbound/quality-checks')} className="text-primary hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isPending = qc.result === QualityCheckResult.Pending;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/inbound/quality-checks')}
          className="p-2 hover:bg-background-hover rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              QC: {qc.qcNumber}
            </h1>
            <StatusBadge status={qualityCheckResultLabel[qc.result as QualityCheckResult] || 'Unknown'} />
          </div>
          <p className="text-text-secondary mt-1">
            Phiếu nhận hàng: {qc.grNumber}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          {isPending && (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={completeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Lưu & Hoàn tất QC
            </button>
          )}
          {(qc.result === QualityCheckResult.Passed || qc.result === QualityCheckResult.Partial) && (
            <button
              onClick={() => navigate(`/inbound/putaway-tasks?search=${qc.grNumber}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-info rounded-lg hover:bg-info/90 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Xem phiếu Putaway
            </button>
          )}
          {(qc.result === QualityCheckResult.Failed || qc.result === QualityCheckResult.Partial) && (
            <>
              <button
                onClick={() => {
                  const locationId = window.prompt('Nhập ID Vị trí Quarantine:', '1');
                  if (locationId) {
                    inboundApi.quarantineQualityCheckFailed(Number(id), { locationId: Number(locationId), notes: 'Chuyển quarantine' })
                      .then(() => {
                        toast.success('Đã chuyển Quarantine thành công');
                        queryClient.invalidateQueries({ queryKey: [...inboundKeys.qualityChecks, id] });
                      })
                      .catch(err => toast.error(err.message));
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-warning rounded-lg hover:bg-warning/90 transition-colors flex items-center gap-2"
              >
                <XCircle size={18} />
                Chuyển Quarantine
              </button>
              <button
                onClick={() => {
                   navigate('/inbound/return-to-vendor');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/90 transition-colors flex items-center gap-2"
              >
                <XCircle size={18} />
                Tạo RTV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('lines')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'lines' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Chi tiết kiểm tra ({qc.lines?.length || 0})
          {activeTab === 'lines' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'overview' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Tổng quan
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
          )}
        </button>
      </div>

      {activeTab === 'lines' && (
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-12">#</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm">Sản phẩm</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-24">SL Kiểm</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-24">SL Đạt</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-24">SL Lỗi</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-32">Lô SX</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-48">Số Serial Lỗi</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-sm w-48">Lý do lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {fields.map((field, index) => {
                  const line = qc.lines?.[index];
                  if (!line) return null;
                  return (
                    <tr key={field.id} className="hover:bg-background-hover transition-colors">
                      <td className="px-4 py-3 text-sm text-text-secondary">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{line.productName}</div>
                        <div className="text-sm text-text-secondary">{line.productSku}</div>
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                           <input
                             type="number"
                             step="0.01"
                             {...register(`lines.${index}.qtyInspected`, { valueAsNumber: true })}
                             className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                           />
                        ) : (
                          <span className="font-medium text-primary">{line.qtyInspected}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                           <input
                             type="number"
                             step="0.01"
                             {...register(`lines.${index}.qtyPassed`, { valueAsNumber: true })}
                             className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-success"
                           />
                        ) : (
                          <span className="font-medium text-success">{line.qtyPassed}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                           <input
                             type="number"
                             step="0.01"
                             {...register(`lines.${index}.qtyFailed`, { valueAsNumber: true })}
                             className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-error"
                           />
                        ) : (
                          <span className="font-medium text-error">{line.qtyFailed}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">{(line as any).lotNumber || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {line.trackSerialNumber ? (
                          isPending ? (
                            <textarea
                              placeholder="Nhập Serial lỗi..."
                              {...register(`lines.${index}.failedSerialsStr` as any)}
                              className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[40px] resize-y"
                              rows={2}
                            />
                          ) : (
                            <div className="text-sm text-text-secondary max-h-20 overflow-y-auto">
                              {(line as any).failedSerials?.join(', ') || '-'}
                            </div>
                          )
                        ) : (
                           <span className="text-sm text-text-secondary opacity-50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                           <input
                             type="text"
                             placeholder="Nhập lý do nếu có lỗi..."
                             {...register(`lines.${index}.failureReason`)}
                             className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                           />
                        ) : (
                          <span className="text-sm text-text-secondary">{line.failureReason || '-'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {isPending && (
             <div className="mt-6 space-y-4 pt-6 border-t border-border">
                <h4 className="font-medium text-text-primary">Thông tin thêm</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Ghi chú chung</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Lý do từ chối (nếu có)</label>
                    <textarea
                      {...register('rejectReason')}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
             </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4 border-b border-border pb-2">
              Thông tin chung
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Mã GR</span>
                <span className="col-span-2 font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/inbound/goods-receipts/${qc.goodsReceiptId}`)}>
                  {qc.grNumber}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Người kiểm</span>
                <span className="col-span-2 text-text-primary">{qc.inspectorId || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Ngày kiểm</span>
                <span className="col-span-2 text-text-primary">
                  {qc.inspectedAt ? format(new Date(qc.inspectedAt), 'dd/MM/yyyy HH:mm') : '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Phương pháp</span>
                <span className="col-span-2 text-text-primary">{qc.methodUsed || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityCheckDetailPage;
