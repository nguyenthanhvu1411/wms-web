import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTransfer, useApproveTransfer, useCompleteTransfer, useCancelTransfer, useStartPicking, useConfirmPicking, useDispatchTransfer, useMarkInTransit, useStartReceivingTransfer, useReceiveTransfer, useSubmitTransfer } from './hooks/useTransfers';
import { ArrowLeft, CheckCircle, Package, Edit, XCircle, ArrowRight, Truck, PackageOpen } from 'lucide-react';
import { TransferStatus } from '@/types/wms-enums';
import { TimelineStepper, type TimelineStep } from '@/components/Shared/TimelineStepper';
import { TransferPickingModal } from './components/TransferPickingModal';
import { TransferTransitModal } from './components/TransferTransitModal';
import { TransferReceiveModal } from './components/TransferReceiveModal';

const TransferDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useTransfer(Number(id));
  const submitMutation = useSubmitTransfer();
  const approveMutation = useApproveTransfer();
  const startPickingMutation = useStartPicking();
  const confirmPickingMutation = useConfirmPicking();
  const dispatchMutation = useDispatchTransfer();
  const markInTransitMutation = useMarkInTransit();
  const startReceivingMutation = useStartReceivingTransfer();
  const receiveMutation = useReceiveTransfer();
  const completeMutation = useCompleteTransfer();
  const cancelMutation = useCancelTransfer();
  const { user } = useAuthStore();

  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
  const [isTransitModalOpen, setIsTransitModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  if (isLoading) return <div className="p-10 font-bold text-slate-500 uppercase tracking-wider">ĐANG TẢI DỮ LIỆU...</div>;
  if (!order) return <div className="p-10 font-bold text-orange-600 uppercase tracking-wider">KHÔNG TÌM THẤY PHIẾU CHUYỂN KHO</div>;

  const chronologicalOrder: number[] = [
    TransferStatus.Draft,
    TransferStatus.Submitted,
    TransferStatus.Approved,
    TransferStatus.Picking,
    TransferStatus.Dispatched,
    TransferStatus.InTransit,
    TransferStatus.Receiving,
    TransferStatus.Completed
  ];

  const getStatusIndex = (status: number) => {
    const idx = chronologicalOrder.indexOf(status);
    return idx === -1 ? 99 : idx;
  };

  const currentIdx = getStatusIndex(order.status);

  const timelineSteps: TimelineStep[] = [
    {
      status: TransferStatus.Draft,
      label: 'KHỞI TẠO',
      timestamp: order.createdAt || null,
      actor: order.requestedBy || null,
      isCurrent: order.status === TransferStatus.Draft || order.status === TransferStatus.Submitted,
      isCompleted: currentIdx > getStatusIndex(TransferStatus.Submitted),
      isFailed: false,
      duration: null
    },
    {
      status: TransferStatus.Approved,
      label: 'ĐÃ DUYỆT',
      timestamp: order.approvedAt || null,
      actor: order.approvedBy || null,
      isCurrent: order.status === TransferStatus.Approved,
      isCompleted: currentIdx > getStatusIndex(TransferStatus.Approved) && order.status !== TransferStatus.Rejected,
      isFailed: order.status === TransferStatus.Rejected,
      duration: null
    },
    {
      status: TransferStatus.Picking,
      label: 'ĐANG NHẶT HÀNG',
      timestamp: order.pickedAt || null,
      actor: order.pickedBy || null,
      isCurrent: order.status === TransferStatus.Picking,
      isCompleted: currentIdx > getStatusIndex(TransferStatus.Picking),
      isFailed: false,
      duration: null
    },
    {
      status: TransferStatus.Dispatched,
      label: 'ĐÃ XUẤT KHO',
      timestamp: order.dispatchedAt || null,
      actor: order.dispatchedBy || null,
      isCurrent: order.status === TransferStatus.Dispatched,
      isCompleted: currentIdx > getStatusIndex(TransferStatus.Dispatched),
      isFailed: false,
      duration: null
    },
    {
      status: TransferStatus.InTransit,
      label: 'ĐANG VẬN CHUYỂN',
      timestamp: order.actualDate || null,
      actor: order.driver || null,
      isCurrent: order.status === TransferStatus.InTransit,
      isCompleted: currentIdx > getStatusIndex(TransferStatus.InTransit),
      isFailed: false,
      duration: null
    },
    {
      status: TransferStatus.Receiving,
      label: 'ĐANG NHẬN HÀNG',
      timestamp: order.receivedAt || null,
      actor: order.receivedBy || null,
      isCurrent: order.status === TransferStatus.Receiving,
      isCompleted: currentIdx > getStatusIndex(TransferStatus.Receiving),
      isFailed: false,
      duration: null
    },
    {
      status: TransferStatus.Completed,
      label: 'HOÀN THÀNH',
      timestamp: order.executedAt || null,
      actor: order.executedBy || null,
      isCurrent: order.status === TransferStatus.Completed,
      isCompleted: order.status === TransferStatus.Completed,
      isFailed: false,
      duration: null
    }
  ];

  if (order.status === TransferStatus.Cancelled) {
    // Add cancel step if cancelled
    const currentStatusIndex = timelineSteps.findIndex(s => s.status === order.status) || 0;
    timelineSteps.splice(currentStatusIndex + 1, 0, {
      status: TransferStatus.Cancelled,
      label: 'ĐÃ HỦY',
      timestamp: order.updatedAt,
      actor: null,
      isCurrent: true,
      isCompleted: false,
      isFailed: true,
      duration: null,
      note: order.reason
    });
  }

  const isAdmin = user?.role === 1; // Assuming Admin is 1
  const canApprove = isAdmin || user?.permissions.includes('Transfer.Approve');
  const canComplete = isAdmin || user?.permissions.includes('Transfer.Create');

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto">
      {/* HEADER ACTION BAR */}
      <div className="bg-white border-b border-slate-200 text-slate-900 p-4 flex justify-between items-center shrink-0 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/transfers')}
            className="p-2 border border-transparent hover:border-slate-300 hover:bg-slate-50 transition-colors text-slate-500 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">ĐIỀU CHUYỂN KHO</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{order.transferNumber}</h1>
          </div>
        </div>

        <div className="flex gap-3">
          {(order.status === TransferStatus.Draft || order.status === TransferStatus.Submitted) && (
            <>
              {order.status === TransferStatus.Draft && (
                <button
                  onClick={() => navigate(`/transfers/${id}/edit`)}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Edit size={16} /> SỬA
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm('Xác nhận duyệt phiếu điều chuyển này?')) approveMutation.mutate({ id: order.id });
                }}
                disabled={approveMutation.isPending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <CheckCircle size={16} /> DUYỆT PHIẾU
              </button>
            </>
          )}

          {order.status === TransferStatus.Approved && (
            <button
              onClick={() => {
                if (window.confirm('Bắt đầu nhặt hàng?')) startPickingMutation.mutate({ id: order.id });
              }}
              disabled={startPickingMutation.isPending}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Package size={16} /> BẮT ĐẦU NHẶT HÀNG
            </button>
          )}

          {order.status === TransferStatus.Picking && (
            <button
              onClick={() => setIsPickingModalOpen(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Package size={16} /> XÁC NHẬN NHẶT HÀNG
            </button>
          )}

          {order.status === TransferStatus.Dispatched && (
            <button
              onClick={() => setIsTransitModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Truck size={16} /> BẮT ĐẦU VẬN CHUYỂN
            </button>
          )}

          {order.status === TransferStatus.InTransit && (
            <button
              onClick={() => {
                if (window.confirm('Xác nhận bắt đầu nhận hàng tại kho đích?')) startReceivingMutation.mutate({ id: order.id });
              }}
              disabled={startReceivingMutation.isPending}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-sky-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <PackageOpen size={16} /> BẮT ĐẦU NHẬN HÀNG
            </button>
          )}

          {order.status === TransferStatus.Receiving && (
            <button
              onClick={() => setIsReceiveModalOpen(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <CheckCircle size={16} /> XÁC NHẬN NHẬP KHO
            </button>
          )}

          {(order.status === TransferStatus.Draft || order.status === TransferStatus.Approved || order.status === TransferStatus.Submitted) && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn hủy phiếu này?')) cancelMutation.mutate({ id: order.id });
              }}
              disabled={cancelMutation.isPending}
              className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <XCircle size={16} /> HỦY
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* MAIN DATA SECTION (75%) */}
        <div className="w-3/4 overflow-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">TỪ KHO XUẤT</h3>
              <div className="text-xl font-bold text-slate-900 mb-1">{order.fromWarehouseCode}</div>
              <div className="text-sm font-medium text-slate-600 mb-2">{order.fromWarehouseName}</div>
              <div className="inline-block bg-slate-50 text-slate-700 font-mono font-medium px-3 py-1 text-xs rounded border border-slate-200">
                Vị trí: {order.fromLocationCode}
              </div>
            </div>

            <div className="px-8 flex flex-col items-center justify-center pt-4">
              <ArrowRight size={32} className="text-slate-300 mb-2" strokeWidth={1.5} />
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ĐIỀU CHUYỂN</div>
            </div>

            <div className="flex-1 text-right">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">ĐẾN KHO NHẬN</h3>
              <div className="text-xl font-bold text-slate-900 mb-1">{order.toWarehouseCode}</div>
              <div className="text-sm font-medium text-slate-600 mb-2">{order.toWarehouseName}</div>
              <div className="inline-block bg-slate-50 text-slate-700 font-mono font-medium px-3 py-1 text-xs rounded border border-slate-200">
                Vị trí: {order.toLocationCode}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">HÀNG HÓA YÊU CẦU</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">SẢN PHẨM</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">SL YÊU CẦU</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">ĐÃ CHUYỂN</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">GIÁ TRỊ</th>
                </tr>
              </thead>
              <tbody>
                {(order.lines && order.lines.length > 0) ? (
                  order.lines.map((line) => (
                    <tr key={line.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-slate-900 mb-1">{line.productSku}</div>
                        <div className="text-sm font-medium text-slate-600 mb-2">{line.productName}</div>
                        {line.lotNumber && (
                          <div className="inline-block bg-orange-50 text-orange-800 font-mono text-xs font-bold px-2 py-0.5 border border-orange-200">
                            LOT: {line.lotNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-mono font-bold text-lg text-slate-900">
                          {line.qtyRequested} <span className="text-sm font-medium text-slate-500">{line.uomCode}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className={`font-mono font-bold text-lg ${line.qtyReceived >= line.qtyRequested ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {line.qtyReceived} <span className="text-sm font-medium text-slate-400">{line.uomCode}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(line.qtyRequested * line.unitCost)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Intl.NumberFormat('vi-VN').format(line.unitCost)} / {line.uomCode}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-900 mb-1">{order.productSku}</div>
                      <div className="text-sm font-medium text-slate-600 mb-2">{order.productName}</div>
                      {order.lotNumber && (
                        <div className="inline-block bg-orange-50 text-orange-800 font-mono text-xs font-bold px-2 py-0.5 border border-orange-200">
                          LOT: {order.lotNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-mono font-bold text-lg text-slate-900">
                        {order.qtyRequested} <span className="text-sm font-medium text-slate-500">{order.uomCode}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className={`font-mono font-bold text-lg ${order.qtyTransferred >= order.qtyRequested ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {order.qtyTransferred} <span className="text-sm font-medium text-slate-400">{order.uomCode}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalValue)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Intl.NumberFormat('vi-VN').format(order.unitCost)} / {order.uomCode}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WORKFLOW / TIMELINE SECTION (25%) */}
        <div className="w-1/4 flex flex-col gap-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 overflow-auto max-h-[500px]">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">WORKFLOW</h3>
            <TimelineStepper steps={timelineSteps} />
          </div>

          {(order.reason || order.notes) && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">GHI CHÚ</h3>
              {order.reason && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">LÝ DO</div>
                  <div className="font-medium text-sm text-slate-700">{order.reason}</div>
                </div>
              )}
              {order.notes && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">CHI TIẾT</div>
                  <div className="font-medium text-sm text-slate-700 whitespace-pre-wrap">{order.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <TransferPickingModal
          isOpen={isPickingModalOpen}
          onClose={() => setIsPickingModalOpen(false)}
          order={order}
          isLoading={confirmPickingMutation.isPending || dispatchMutation.isPending}
          onConfirm={async (payload) => {
            await confirmPickingMutation.mutateAsync({ id: order.id, data: payload });
            await dispatchMutation.mutateAsync({ id: order.id });
            setIsPickingModalOpen(false);
          }}
        />

        <TransferTransitModal
          isOpen={isTransitModalOpen}
          onClose={() => setIsTransitModalOpen(false)}
          order={order}
          isLoading={markInTransitMutation.isPending}
          onConfirm={async (payload) => {
            await markInTransitMutation.mutateAsync({ id: order.id, data: payload });
            setIsTransitModalOpen(false);
          }}
        />

        <TransferReceiveModal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          order={order}
          isLoading={receiveMutation.isPending}
          onConfirm={async (payload) => {
            await receiveMutation.mutateAsync({ id: order.id, data: payload });
            setIsReceiveModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default TransferDetailPage;
