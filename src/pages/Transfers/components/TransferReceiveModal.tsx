import React, { useState } from 'react';
import { message } from 'antd';
import { PackageOpen, X } from 'lucide-react';
import type { TransferOrder } from '@/types/operations';

interface TransferReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: TransferOrder;
  onConfirm: (payload: { lines: { lineId: number; qtyReceived: number; notes?: string }[]; notes: string }) => void;
  isLoading: boolean;
}

export const TransferReceiveModal: React.FC<TransferReceiveModalProps> = ({
  isOpen, onClose, order, onConfirm, isLoading
}) => {
  const [lines, setLines] = useState<{lineId: number, productId: number, productSku: string, productName: string, qtyExpected: number, qtyReceived: number, lotNumber: string}[]>([]);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setLines(
        order.lines?.map(l => ({
          lineId: l.id,
          productId: l.productId,
          productSku: l.productSku,
          productName: l.productName,
          qtyExpected: l.qtyPicked || l.qtyRequested, // sl đang chuyển tới
          qtyReceived: l.qtyPicked || l.qtyRequested, // default nhận đủ
          lotNumber: l.lotNumber || ''
        })) || []
      );
      setNotes('');
    }
  }, [isOpen, order]);

  const handleQtyChange = (lineId: number, value: number) => {
    setLines(prev => prev.map(l => l.lineId === lineId ? { ...l, qtyReceived: value } : l));
  };

  const handleConfirm = () => {
    if (lines.some(l => l.qtyReceived < 0)) {
      message.error('Số lượng nhận không hợp lệ');
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
            <div className="bg-sky-100 text-sky-600 p-2 rounded-lg">
              <PackageOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kiểm đếm & Nhận hàng</h2>
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
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Lot/Serial</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right">SL Cần nhận</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase text-right w-32">Thực nhận</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.lineId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm font-bold text-slate-800">{line.productSku}</div>
                    <div className="text-xs text-slate-500">{line.productName}</div>
                  </td>
                  <td className="py-3 px-4">
                    {line.lotNumber ? (
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {line.lotNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{line.qtyExpected}</td>
                  <td className="py-3 px-4">
                    <input 
                      type="number" 
                      min={0}
                      className="w-full px-2 py-1.5 text-sm font-mono font-bold text-right border border-slate-300 rounded focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                      value={line.qtyReceived}
                      onChange={(e) => handleQtyChange(line.lineId, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Ghi chú kiểm đếm (Tùy chọn)</label>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none text-sm"
              placeholder="Ghi chú hư hỏng, thiếu sót..."
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
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận Đã Nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};
