import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useCycleCount, 
  useCountCycleCountLine, 
  useStartCycleCount,
  useCompleteCycleCount,
  useReviewCycleCountDifference,
  useApproveCycleCount, 
  useAdjustCycleCount, 
  useCompleteCycleCountWorkflow,
  useCancelCycleCount 
} from './hooks/useCycleCounts';
import { ArrowLeft, CheckCircle, Package, Edit, XCircle, AlertTriangle, Send } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { CycleCountStatus, cycleCountStatusLabel } from '@/types/wms-enums';
import { format } from 'date-fns';
import { Modal, Input } from 'antd';
import type { CycleCountLine } from '@/types/operations';
import { TimelineStepper, type TimelineStep } from '@/components/Shared/TimelineStepper';
import clsx from 'clsx';

const CycleCountDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: order, isLoading } = useCycleCount(Number(id));
  const countLineMutation = useCountCycleCountLine();
  const startCountMutation = useStartCycleCount();
  const completeCountMutation = useCompleteCycleCount();
  const reviewMutation = useReviewCycleCountDifference();
  const completeWorkflowMutation = useCompleteCycleCountWorkflow();
  const approveMutation = useApproveCycleCount();
  const adjustMutation = useAdjustCycleCount();
  const cancelMutation = useCancelCycleCount();
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [serialInput, setSerialInput] = useState('');
  const [activeLine, setActiveLine] = useState<CycleCountLine | null>(null);
  const [countedQty, setCountedQty] = useState<number>(0);

  
  if (isLoading) return <div className="p-10 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;
  if (!order) return <div className="p-10 text-center text-red-600 font-bold">Không tìm thấy phiếu kiểm kê</div>;

  const handleOpenCountModal = (line: CycleCountLine) => {
    setActiveLine(line);
    setCountedQty(line.qtyCounted !== undefined && line.qtyCounted !== null ? line.qtyCounted : line.qtySystem);
    setScannedSerials(line.serialNumbers || []); // If we support serials later
    setSerialInput('');
  };

  const handleSaveCount = () => {
    if (!activeLine) return;
    
    // NOTE: Serial tracking logic could go here
    const finalCountedQty = countedQty;

    countLineMutation.mutate({
      cycleCountId: order.id,
      lineId: activeLine.id,
      data: {
        qtyCounted: finalCountedQty
      }
    }, {
      onSuccess: () => setActiveLine(null)
    });
  };

  const getStatusString = (status: number) => {
    switch(status) {
      case CycleCountStatus.Draft: return 'Draft';
      case CycleCountStatus.Approved: return 'Approved';
      case CycleCountStatus.Counting: return 'InProgress';
      case CycleCountStatus.CompletedCount: return 'Pending';
      case CycleCountStatus.ReviewDifference: return 'Pending';
      case CycleCountStatus.AdjustInventory: return 'Pending';
      case CycleCountStatus.Completed: return 'Completed';
      case CycleCountStatus.Cancelled: return 'Cancelled';
      default: return 'Draft';
    }
  };

  const buildTimelineSteps = (): TimelineStep[] => {
    const s = order.status;
    const isCancelled = s === CycleCountStatus.Cancelled;
    
    return [
      {
        status: CycleCountStatus.Draft,
        label: "Khởi tạo",
        timestamp: order.createdAt,
        actor: order.assignedToFullName || order.assignedTo || null,
        isCompleted: s > CycleCountStatus.Draft && !isCancelled,
        isCurrent: s === CycleCountStatus.Draft,
        isFailed: false,
        duration: null
      },
      {
        status: CycleCountStatus.Approved,
        label: "Đã duyệt",
        timestamp: s >= CycleCountStatus.Approved ? (order.approvedAt ?? null) : null,
        actor: order.approvedBy || null,
        isCompleted: s > CycleCountStatus.Approved && !isCancelled,
        isCurrent: s === CycleCountStatus.Approved,
        isFailed: false,
        duration: null
      },
      {
        status: CycleCountStatus.Counting,
        label: "Đang kiểm kê",
        timestamp: s >= CycleCountStatus.Counting ? (order.startedAt ?? null) : null,
        actor: null,
        isCompleted: s > CycleCountStatus.Counting && !isCancelled,
        isCurrent: s === CycleCountStatus.Counting,
        isFailed: false,
        duration: null
      },
      {
        status: CycleCountStatus.CompletedCount,
        label: "Đã kiểm xong",
        timestamp: s >= CycleCountStatus.CompletedCount ? order.updatedAt : null,
        actor: null,
        isCompleted: s > CycleCountStatus.CompletedCount && !isCancelled,
        isCurrent: s === CycleCountStatus.CompletedCount,
        isFailed: false,
        duration: null
      },
      {
        status: CycleCountStatus.ReviewDifference,
        label: "Chờ đối chiếu",
        timestamp: s >= CycleCountStatus.ReviewDifference ? order.updatedAt : null,
        actor: null,
        isCompleted: s > CycleCountStatus.ReviewDifference && !isCancelled,
        isCurrent: s === CycleCountStatus.ReviewDifference,
        isFailed: false,
        duration: null
      },
      {
        status: CycleCountStatus.AdjustInventory,
        label: "Chờ điều chỉnh",
        timestamp: s >= CycleCountStatus.AdjustInventory ? order.updatedAt : null,
        actor: null,
        isCompleted: s > CycleCountStatus.AdjustInventory && !isCancelled,
        isCurrent: s === CycleCountStatus.AdjustInventory,
        isFailed: false,
        duration: null
      },
      {
        status: CycleCountStatus.Completed,
        label: "Hoàn thành",
        timestamp: s === CycleCountStatus.Completed ? order.updatedAt : null,
        actor: null,
        isCompleted: s === CycleCountStatus.Completed,
        isCurrent: s === CycleCountStatus.Completed,
        isFailed: false,
        duration: null
      },
      ...(isCancelled ? [{
        status: CycleCountStatus.Cancelled,
        label: "Đã hủy",
        timestamp: order.updatedAt,
        actor: null,
        isCompleted: false,
        isCurrent: false,
        isFailed: true,
        note: order.notes,
        duration: null
      }] : [])
    ];
  };

  const isCountComplete = order.countedLines === order.totalLines && order.totalLines > 0;
  // Giả sử có logic permission ở đây (thường check qua Context hoặc Redux)
  // For UI demonstration, we assume user can approve if they see the button.
  
  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* HEADER ACTION BAR */}
      <div className="bg-white text-text-primary p-4 flex justify-between items-center shrink-0 shadow-sm z-10 sticky top-0 border-b border-border">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/cycle-counts')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-text-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
              KHO: {order.warehouseCode} - {order.warehouseName}
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              KIỂM KÊ: {order.countNumber}
              <StatusBadge 
                status={getStatusString(order.status)} 
                text={cycleCountStatusLabel[order.status as unknown as CycleCountStatus]} 
              />
            </h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {order.status === CycleCountStatus.Draft && (
            <>
              <button 
                onClick={() => navigate(`/cycle-counts/${id}/edit`)}
                className="bg-white border border-border text-text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Edit size={16} /> SỬA
              </button>
              <button 
                onClick={() => approveMutation.mutate(order.id)}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={18} /> DUYỆT PHIẾU
              </button>
            </>
          )}

          {order.status === CycleCountStatus.Approved && (
            <button 
              onClick={() => startCountMutation.mutate(order.id)}
              disabled={startCountMutation.isPending}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Send size={18} /> BẮT ĐẦU KIỂM KÊ
            </button>
          )}

          {order.status === CycleCountStatus.Counting && (
            <button 
              onClick={() => completeCountMutation.mutate(order.id)}
              disabled={completeCountMutation.isPending || !isCountComplete}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                !isCountComplete 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-primary text-white hover:bg-primary-hover"
              )}
              title={!isCountComplete ? "Cần kiểm đếm tất cả các dòng" : ""}
            >
              <CheckCircle size={18} /> HOÀN TẤT KIỂM ĐẾM
            </button>
          )}

          {order.status === CycleCountStatus.CompletedCount && (
            <button 
              onClick={() => reviewMutation.mutate(order.id)}
              disabled={reviewMutation.isPending}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} /> XÁC NHẬN ĐỐI CHIẾU
            </button>
          )}

          {order.status === CycleCountStatus.ReviewDifference && (
            <button 
              onClick={() => {
                if (window.confirm('Hệ thống sẽ điều chỉnh tồn kho tự động theo kết quả kiểm kê. Bạn có chắc chắn?')) {
                  adjustMutation.mutate(order.id);
                }
              }}
              disabled={adjustMutation.isPending}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} /> THỰC THI ĐIỀU CHỈNH
            </button>
          )}

          {order.status === CycleCountStatus.AdjustInventory && (
            <button 
              onClick={() => completeWorkflowMutation.mutate(order.id)}
              disabled={completeWorkflowMutation.isPending}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} /> ĐÓNG PHIẾU
            </button>
          )}
          
          {(order.status < CycleCountStatus.Completed) && order.status !== CycleCountStatus.Cancelled && (
             <button 
             onClick={() => {
               if (window.confirm('Bạn có chắc chắn muốn hủy phiếu kiểm kê này?')) {
                 cancelMutation.mutate(order.id);
               }
             }}
             disabled={cancelMutation.isPending}
             className="bg-white border border-red-500 text-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
           >
             <XCircle size={18} /> HỦY PHIẾU
           </button>
          )}
        </div>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto w-full flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center text-text-primary">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <Package size={18} /> Danh sách sản phẩm kiểm kê
              </h3>
              <div className="text-sm font-semibold bg-primary text-white rounded-md px-3 py-1">
                Tiến độ: {order.countedLines} / {order.totalLines}
              </div>
            </div>
            
            {order.totalVarianceQty > 0 && order.status < CycleCountStatus.ReviewDifference && (
              <div className="px-6 py-3 bg-orange-50 border-b border-orange-200 flex items-center gap-3 text-orange-800">
                <AlertTriangle size={20} />
                <span className="font-medium text-sm">Phát hiện chênh lệch tồn kho ({order.totalVarianceQty} đơn vị). Cần ghi chú giải trình trước khi duyệt.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border font-semibold">
                  <tr>
                    <th className="px-6 py-4">VỊ TRÍ</th>
                    <th className="px-6 py-4">SẢN PHẨM</th>
                    <th className="px-6 py-4 text-right">HỆ THỐNG</th>
                    <th className="px-6 py-4 text-right">ĐẾM ĐƯỢC</th>
                    <th className="px-6 py-4 text-right">CHÊNH LỆCH</th>
                    <th className="px-6 py-4 text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines?.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-text-primary">{line.locationCode}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-primary">{line.productSku}</div>
                        <div className="text-xs text-text-secondary font-medium">{line.productName}</div>
                        {line.lotNumber && <div className="text-xs text-text-secondary mt-1 font-medium bg-slate-100 px-1.5 py-0.5 rounded inline-block">Lot: {line.lotNumber}</div>}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium">{line.qtySystem} <span className="text-xs text-text-secondary">{line.uomCode}</span></td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-blue-600">
                        {line.isCounted ? line.qtyCounted : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {line.isCounted ? (
                           <span className={clsx(
                             "font-mono font-semibold px-2 py-1 rounded-md text-xs",
                             line.variance < 0 ? 'bg-red-50 text-red-600' : 
                             line.variance > 0 ? 'bg-orange-50 text-orange-600' : 'text-slate-400'
                           )}>
                             {line.variance > 0 ? '+' : ''}{line.variance}
                           </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                         {(order.status === CycleCountStatus.Counting) && (
                            <button 
                              onClick={() => handleOpenCountModal(line)}
                              className={clsx(
                                "px-4 py-2 rounded-lg text-xs font-medium transition-all w-full border",
                                line.isCounted 
                                  ? "bg-white text-text-secondary border-border hover:bg-slate-50" 
                                  : "bg-primary text-white border-primary hover:bg-primary-hover"
                              )}
                            >
                              {line.isCounted ? "Cập nhật" : "Nhập KQ"}
                            </button>
                         )}
                         {order.status > CycleCountStatus.Counting && line.isCounted && (
                            <span className="text-emerald-500 font-bold text-xs flex justify-center"><CheckCircle size={16}/></span>
                         )}
                      </td>
                    </tr>
                  ))}
                  {!order.lines?.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-secondary font-medium">
                        Chưa có dữ liệu sản phẩm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm border border-border p-6 rounded-xl">
            <h3 className="font-bold text-text-primary mb-5 text-sm border-b border-border pb-3 uppercase">Thông tin phiếu</h3>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-text-secondary font-medium mb-1 text-xs">Người phụ trách</p>
                <p className="font-semibold text-text-primary">{order.assignedToFullName || order.assignedTo || '-'}</p>
              </div>
              <div>
                <p className="text-text-secondary font-medium mb-1 text-xs">Ngày lên lịch</p>
                <p className="font-semibold text-text-primary">{order.scheduledDate ? format(new Date(order.scheduledDate), 'dd/MM/yyyy') : '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-border">
                <p className="text-text-secondary font-medium mb-1 text-xs">Tổng chênh lệch</p>
                <p className={clsx(
                  "font-bold text-2xl font-mono",
                  order.totalVarianceQty > 0 ? "text-orange-600" : "text-emerald-600"
                )}>
                  {order.totalVarianceQty > 0 ? '+' : ''}{order.totalVarianceQty}
                </p>
              </div>
              <div>
                <p className="text-text-secondary font-medium mb-1 text-xs">Giá trị điều chỉnh</p>
                <p className="font-semibold text-text-primary font-mono text-lg">{order.totalAdjustmentValue.toLocaleString('vi-VN')} đ</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-text-secondary font-medium mb-1 text-xs">Ghi chú</p>
                  <p className="text-text-primary bg-slate-50 rounded-md p-3 border border-border text-xs leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm border border-border p-6 rounded-xl">
             <h3 className="font-bold text-text-primary mb-5 text-sm border-b border-border pb-3 uppercase">Quá trình thực hiện</h3>
             <TimelineStepper steps={buildTimelineSteps()} className="mt-4" />
          </div>
        </div>
      </div>

      <Modal
        title={<div className="font-bold text-text-primary border-b border-border pb-3 text-lg">Nhập kết quả kiểm đếm</div>}
        open={!!activeLine}
        onCancel={() => setActiveLine(null)}
        onOk={handleSaveCount}
        okText={<span className="font-medium">Lưu kết quả</span>}
        cancelText={<span className="font-medium">Hủy</span>}
        width={500}
        okButtonProps={{ className: "bg-primary rounded-lg border-none hover:bg-primary-hover shadow-none", loading: countLineMutation.isPending }}
        cancelButtonProps={{ className: "rounded-lg font-medium hover:bg-slate-50 border-border" }}
        className="rounded-xl overflow-hidden"
      >
        {activeLine && (
          <div className="space-y-5 py-4">
            <div className="bg-slate-50 border border-border rounded-lg text-text-primary p-4">
              <p className="text-sm font-bold tracking-wide uppercase">{activeLine.productSku}</p>
              <p className="text-sm text-text-secondary font-medium mt-1">{activeLine.productName}</p>
              <div className="mt-4 flex justify-between items-end border-t border-border pt-3">
                <p className="text-xs text-text-secondary font-medium">Vị trí</p>
                <p className="font-mono font-semibold text-base">{activeLine.locationCode}</p>
              </div>
              <div className="mt-1 flex justify-between items-end">
                <p className="text-xs text-text-secondary font-medium">SL Hệ thống</p>
                <p className="font-mono font-bold text-lg text-emerald-600">{activeLine.qtySystem} <span className="text-sm">{activeLine.uomCode}</span></p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Số lượng đếm được thực tế</label>
              <input 
                type="number"
                min="0"
                value={countedQty}
                onChange={(e) => setCountedQty(Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCount();
                }}
                className="w-full border-2 border-primary rounded-lg px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                placeholder="Nhập số lượng..."
                autoFocus
              />
            </div>
            {countedQty !== activeLine.qtySystem && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 text-sm text-orange-800 font-semibold flex items-center gap-2">
                 <AlertTriangle size={16} />
                 Chênh lệch: {countedQty - activeLine.qtySystem} {activeLine.uomCode}
              </div>
            )}
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default CycleCountDetailPage;
