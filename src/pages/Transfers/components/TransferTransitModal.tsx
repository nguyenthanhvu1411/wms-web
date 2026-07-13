import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { Truck, X } from 'lucide-react';
import type { TransferOrder } from '@/types/operations';

interface TransferTransitModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: TransferOrder;
  onConfirm: (payload: { carrier: string; vehicle: string; driver: string; notes: string }) => void;
  isLoading: boolean;
}

export const TransferTransitModal: React.FC<TransferTransitModalProps> = ({
  isOpen, onClose, order, onConfirm, isLoading
}) => {
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [vehicle, setVehicle] = useState(order.vehicle || '');
  const [driver, setDriver] = useState(order.driver || '');
  const [notes, setNotes] = useState(order.notes || '');

  React.useEffect(() => {
    if (isOpen) {
      setCarrier(order.carrier || '');
      setVehicle(order.vehicle || '');
      setDriver(order.driver || '');
      setNotes(order.notes || '');
    }
  }, [isOpen, order]);

  const handleConfirm = () => {
    onConfirm({ carrier, vehicle, driver, notes });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Giao Đơn vị vận chuyển</h2>
              <p className="text-xs font-medium text-slate-500">Phiếu {order.transferNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Đơn vị vận chuyển</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
              placeholder="Vd: Giao Hàng Nhanh, Viettel Post..."
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Biển số xe</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono uppercase"
              placeholder="51H-123.45"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tài xế / Người giao</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
              placeholder="Tên hoặc SĐT tài xế..."
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ghi chú (Tùy chọn)</label>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-sm"
              placeholder="Ghi chú quá trình giao nhận..."
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
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận giao'}
          </button>
        </div>
      </div>
    </div>
  );
};
