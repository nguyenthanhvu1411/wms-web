import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';

interface InventoryCandidate {
  locationCode: string;
  lotNumber: string;
  expiryDate: string;
  availableQty: number;
  fefoRank: number;
  distance: number;
}

interface InventoryCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCode: string;
  qtyRequired: number;
}

export const InventoryCandidateModal = ({ isOpen, onClose, productCode, qtyRequired }: InventoryCandidateModalProps) => {
  if (!isOpen) return null;

  const candidates: InventoryCandidate[] = [
    { locationCode: 'A01-01-01', lotNumber: 'LOT-2023-01', expiryDate: '2024-01-01', availableQty: 50, fefoRank: 1, distance: 15 },
    { locationCode: 'B02-05-02', lotNumber: 'LOT-2023-05', expiryDate: '2024-05-01', availableQty: 100, fefoRank: 2, distance: 40 },
    { locationCode: 'A01-01-02', lotNumber: 'LOT-2023-08', expiryDate: '2024-08-01', availableQty: 30, fefoRank: 3, distance: 16 },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Cấp phát tồn kho (Allocate)</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 flex gap-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <p className="text-sm text-slate-500">Mã sản phẩm</p>
              <p className="font-semibold text-lg">{productCode}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">SL cần cấp phát</p>
              <p className="font-semibold text-lg text-primary">{qtyRequired}</p>
            </div>
          </div>

          <h3 className="font-semibold text-slate-800 mb-3">Inventory Candidates (FEFO Sorted)</h3>
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">FEFO Rank</th>
                <th className="px-4 py-3">Vị trí (Location)</th>
                <th className="px-4 py-3">Lot / HSD</th>
                <th className="px-4 py-3 text-right">SL Khả dụng</th>
                <th className="px-4 py-3 text-right">Khoảng cách</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-center font-bold text-slate-400">#{item.fefoRank}</td>
                  <td className="px-4 py-3 font-medium text-primary">{item.locationCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.lotNumber}</div>
                    <div className="text-xs text-slate-400">HSD: {item.expiryDate}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-success">{item.availableQty}</td>
                  <td className="px-4 py-3 text-right">{item.distance}m</td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-primary hover:bg-primary/10 p-1.5 rounded inline-flex items-center gap-1 text-xs font-medium border border-primary/30">
                      Chọn <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">
            Hủy
          </button>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-primary text-primary font-medium hover:bg-primary/5 rounded-lg flex items-center gap-2">
              <Check size={18} /> Manual Allocate
            </button>
            <button className="px-4 py-2 bg-primary text-white font-medium hover:bg-primary-hover rounded-lg flex items-center gap-2">
              <Check size={18} /> Auto Allocate (FEFO)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
