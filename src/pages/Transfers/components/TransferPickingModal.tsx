import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { Package, X } from 'lucide-react';
import type { TransferOrder } from '@/types/operations';

interface TransferPickingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: TransferOrder;
  onConfirm: (payload: { lines: { lineId: number; qtyPicked: number; lotNumber?: string }[]; notes: string }) => void;
  isLoading: boolean;
}

export const TransferPickingModal: React.FC<TransferPickingModalProps> = ({
  isOpen, onClose, order, onConfirm, isLoading
}) => {
  const [lines, setLines] = useState<{lineId: number, productId: number, productSku: string, productName: string, qtyRequested: number, qtyPicked: number, lotNumber: string}[]>([]);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setLines(
        order.lines?.map(l => ({
          lineId: l.id,
          productId: l.productId,
          productSku: l.productSku,
          productName: l.productName,
          qtyRequested: l.qtyRequested,
          qtyPicked: l.qtyRequested, // default full pick
          lotNumber: l.lotNumber || ''
        })) || []
      );
      setNotes('');
    }
  }, [isOpen, order]);

  const handleQtyChange = (lineId: number, value: number) => {
    setLines(prev => prev.map(l => l.lineId === lineId ? { ...l, qtyPicked: value } : l));
  };

  const handleLotChange = (lineId: number, value: string) => {
    setLines(prev => prev.map(l => l.lineId === lineId ? { ...l, lotNumber: value } : l));
  };

  const handleConfirm = () => {
    if (lines.some(l => l.qtyPicked < 0)) {
      message.error('Số lượng nhặt không hợp lệ');
      return;
    }
    onConfirm({ lines, notes });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Xác nhận Nhặt hàng (Picking)</h2>
              <p className="text-xs font-medium text-slate-500">Phiếu {order.transferNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">SL Yêu cầu</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Lot/Serial</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right w-32">Thực nhặt</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.lineId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm font-bold text-slate-800">{line.productSku}</div>
                    <div className="text-xs text-slate-500">{line.productName}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{line.qtyRequested}</td>
                  <td className="py-3 px-4">
                    <input 
                      type="text" 
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Lot/Serial..."
                      value={line.lotNumber}
                      onChange={(e) => handleLotChange(line.lineId, e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input 
                      type="number" 
                      min={0}
                      className="w-full px-2 py-1.5 text-sm font-mono font-bold text-right border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                      value={line.qtyPicked}
                      onChange={(e) => handleQtyChange(line.lineId, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Ghi chú (Tùy chọn)</label>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none text-sm"
              placeholder="Ghi chú thêm trong quá trình nhặt hàng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors text-sm"
          >
            Hủy
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận nhặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};
