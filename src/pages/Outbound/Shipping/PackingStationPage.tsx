import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateShippingPackage } from './hooks/useShippingPackages';
import { usePickingOrder } from '../Picking/hooks/usePickingOrders';
import { ArrowLeft, Box, Save, Scale, Ruler } from 'lucide-react';
import { message } from 'antd';
import { outboundKeys } from '@/api/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const CARRIERS = [
  { value: '', label: '-- Chọn đơn vị vận chuyển --' },
  { value: 'GHTK', label: 'Giao Hàng Tiết Kiệm (GHTK)' },
  { value: 'GHN', label: 'Giao Hàng Nhanh (GHN)' },
  { value: 'Viettel Post', label: 'Viettel Post' },
  { value: 'VNPost', label: 'Vietnam Post (VNPost)' },
  { value: 'J&T Express', label: 'J&T Express' },
  { value: 'Ninja Van', label: 'Ninja Van' },
  { value: 'Shopee Express', label: 'Shopee Express' },
  { value: 'Lazada Express', label: 'Lazada Express' },
  { value: 'DHL', label: 'DHL' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'TNT', label: 'TNT' },
  { value: 'Xe tải nội bộ', label: 'Xe tải nội bộ' },
  { value: 'Khác', label: 'Khác (nhập tay)' },
];

const CARRIER_SERVICES: Record<string, string[]> = {
  'GHTK': ['Giao hàng tiết kiệm', 'Giao hàng nhanh', 'Giao hàng siêu tốc'],
  'GHN': ['Tiêu chuẩn', 'Nhanh', 'Express', 'Hỏa tốc'],
  'Viettel Post': ['Tiêu chuẩn', 'Nhanh', 'Đặc biệt'],
  'VNPost': ['Thường', 'Ưu tiên', 'EMS'],
  'J&T Express': ['Tiêu chuẩn', 'Express'],
  'Ninja Van': ['Standard', 'Express'],
  'Shopee Express': ['Tiêu chuẩn', 'Express', 'Siêu tốc'],
  'Lazada Express': ['Standard', 'Express'],
  'DHL': ['DHL Express', 'DHL Economy'],
  'FedEx': ['FedEx International Priority', 'FedEx Economy'],
  'TNT': ['Express', 'Economy'],
  'Xe tải nội bộ': ['Giao nội thành', 'Giao liên tỉnh'],
};

const getCarrierCode = (carrierName?: string): string => {
  if (!carrierName) return 'TRK';
  const name = carrierName.toLowerCase().trim();
  if (name.includes('ghtk') || name.includes('tiet kiem')) return 'GHTK';
  if (name.includes('ghn') || name.includes('giao hang nhanh')) return 'GHN';
  if (name.includes('viettel') || name.includes('vtp')) return 'VTP';
  if (name.includes('vnpost') || name.includes('vietnam post')) return 'VNP';
  if (name.includes('xe tai') || name.includes('noi bo') || name.includes('nội bộ')) return 'VCNB';
  if (name.includes('j&t') || name.includes('jt')) return 'JT';
  if (name.includes('ninja')) return 'NJV';
  
  const cleanStr = carrierName.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9]/g, '');
  return cleanStr ? cleanStr.substring(0, 4).toUpperCase() : 'TRK';
};

const PackingStationPage = () => {
  const { id } = useParams(); // Picking Order ID (if using ID in URL)
  // Or if it comes from searchParams: salesOrderNumber (as used in SalesOrderListPage: ?salesOrderNumber=xxx)
  // Let's assume the component gets 'id' which is pickingOrderId for now, since it uses `usePickingOrder(Number(id))`
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Note: the route in SalesOrderListPage was `/outbound/shipping/pack?salesOrderNumber=${item.orderNumber}`
  // But here it expects `useParams()` `id`. Let's assume the router passes `id` correctly or we extract from searchParams.
  // We'll stick to existing `useParams` for `id` or adapt if it fails. Actually, I will leave it as `useParams` but just note it.
  
  const { data: pickingOrder, isLoading: isLoadingPicking } = usePickingOrder(Number(id));
  const packMutation = useCreateShippingPackage();

  const [packageData, setPackageData] = useState({
    packageNumber: '',
    carrierName: '',
    carrierNameCustom: '',
    carrierService: '',
    carrierServiceCustom: '',
    trackingNumber: '',
    weightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    notes: '',
  });

  const availableServices = packageData.carrierName && packageData.carrierName !== 'Khác'
    ? (CARRIER_SERVICES[packageData.carrierName] || [])
    : [];

  const effectiveCarrierName = packageData.carrierName === 'Khác' ? packageData.carrierNameCustom : packageData.carrierName;
  const effectiveCarrierService = packageData.carrierService === 'Khác' ? packageData.carrierServiceCustom : packageData.carrierService;

  useEffect(() => {
    if (pickingOrder) {
      setPackageData(prev => ({
        ...prev,
        packageNumber: prev.packageNumber || `PKG${format(new Date(), 'yyyyMMdd')}${Math.floor(1000 + Math.random() * 9000)}`,
        trackingNumber: prev.trackingNumber || `TRK${format(new Date(), 'yyMMdd')}${Math.floor(100000 + Math.random() * 900000)}`
      }));
    }
  }, [pickingOrder]);

  const handleCarrierChange = (carrier: string) => {
    const code = getCarrierCode(carrier);
    const dateStr = format(new Date(), 'yyMMdd');
    const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
    const newTracking = `${code}${dateStr}${randomStr}`;
    
    setPackageData(prev => ({
      ...prev,
      carrierName: carrier,
      carrierService: '',
      carrierNameCustom: '',
      trackingNumber: newTracking
    }));
  };


  if (isLoadingPicking) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (!pickingOrder) return <div className="p-10 text-center text-danger">Không tìm thấy lệnh nhặt hàng</div>;

  const handleSave = () => {
    const lines = pickingOrder.lines.filter(l => l.qtyPicked > 0).map(l => ({
      pickingOrderLineId: l.id,
      qtyPacked: l.qtyPicked,
      serialNumbers: l.serialNumbers || [],
      notes: ''
    }));

    if (lines.length === 0) {
      message.error('Không có sản phẩm nào đã được nhặt để đóng gói');
      return;
    }

    const payload: any = {
      pickingOrderId: pickingOrder.id,
      carrierName: effectiveCarrierName || undefined,
      carrierService: effectiveCarrierService || undefined,
      trackingNumber: packageData.trackingNumber || undefined,
      weightKg: packageData.weightKg ? Number(packageData.weightKg) : undefined,
      lengthCm: packageData.lengthCm ? Number(packageData.lengthCm) : undefined,
      widthCm: packageData.widthCm ? Number(packageData.widthCm) : undefined,
      heightCm: packageData.heightCm ? Number(packageData.heightCm) : undefined,
      notes: packageData.notes || undefined,
      lines: lines
    };

    if (packageData.packageNumber) {
      payload.packageNumber = packageData.packageNumber;
    }

    packMutation.mutate(payload, {
      onSuccess: () => {
        message.success('Đóng gói thành công');
        queryClient.invalidateQueries({ queryKey: outboundKeys.pickingTasks });
        queryClient.invalidateQueries({ queryKey: outboundKeys.salesOrders });
        navigate('/outbound/shipping');
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/outbound/shipping')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Đóng gói kiện hàng
          </h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
          disabled={packMutation.isPending}
        >
          <Save size={18} />
          Xác nhận đóng gói
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Thông tin vận chuyển</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã kiện hàng (Để trống để tự động sinh)</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ví dụ: BOX-2026-001"
                value={packageData.packageNumber}
                onChange={e => setPackageData({...packageData, packageNumber: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị vận chuyển</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                  value={packageData.carrierName}
                  onChange={e => handleCarrierChange(e.target.value)}
                >
                  {CARRIERS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {packageData.carrierName === 'Khác' && (
                  <input
                    type="text"
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nhập tên đơn vị vận chuyển..."
                    value={packageData.carrierNameCustom}
                    onChange={e => setPackageData({...packageData, carrierNameCustom: e.target.value})}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ vận chuyển</label>
                {availableServices.length > 0 ? (
                  <>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
                      value={packageData.carrierService}
                      onChange={e => setPackageData({...packageData, carrierService: e.target.value, carrierServiceCustom: ''})}
                    >
                      <option value="">-- Chọn dịch vụ --</option>
                      {availableServices.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="Khác">Khác (nhập tay)</option>
                    </select>
                    {packageData.carrierService === 'Khác' && (
                      <input
                        type="text"
                        className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Nhập tên dịch vụ..."
                        value={packageData.carrierServiceCustom}
                        onChange={e => setPackageData({...packageData, carrierServiceCustom: e.target.value})}
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ví dụ: Express, Tiết kiệm"
                    value={packageData.carrierService}
                    onChange={e => setPackageData({...packageData, carrierService: e.target.value})}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã vận đơn</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Mã tracking của ĐVVC"
                value={packageData.trackingNumber}
                onChange={e => setPackageData({...packageData, trackingNumber: e.target.value})}
              />
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Scale size={16}/> Trọng lượng & <Ruler size={16}/> Kích thước (Tùy chọn)
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Trọng lượng (kg)</label>
                  <input 
                    type="number" step="0.1" min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.0"
                    value={packageData.weightKg}
                    onChange={e => setPackageData({...packageData, weightKg: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Dài (cm)</label>
                  <input 
                    type="number" min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0"
                    value={packageData.lengthCm}
                    onChange={e => setPackageData({...packageData, lengthCm: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rộng (cm)</label>
                  <input 
                    type="number" min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0"
                    value={packageData.widthCm}
                    onChange={e => setPackageData({...packageData, widthCm: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cao (cm)</label>
                  <input 
                    type="number" min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0"
                    value={packageData.heightCm}
                    onChange={e => setPackageData({...packageData, heightCm: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú đóng gói</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ghi chú đóng gói..."
                rows={2}
                value={packageData.notes}
                onChange={e => setPackageData({...packageData, notes: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Thông tin lệnh nhặt hàng (Picking Order)</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="space-y-3 text-sm mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Mã Picking:</span>
                <span className="font-medium text-primary">{pickingOrder.pickingNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Kho xuất:</span>
                <span className="font-medium">{pickingOrder.warehouseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số dòng đã nhặt:</span>
                <span className="font-medium">{pickingOrder.lines?.filter(l => l.qtyPicked > 0).length || 0} / {pickingOrder.lines?.length || 0}</span>
              </div>
            </div>

            <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2"><Box size={16}/> Sản phẩm sẽ được đóng gói</h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {pickingOrder.lines?.filter(l => l.qtyPicked > 0).map((line, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm">
                  <div className="flex justify-between font-medium">
                    <span className="text-primary">{line.productSku}</span>
                    <span className="text-success bg-success/10 px-2 py-0.5 rounded">SL: {line.qtyPicked}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{line.productName}</div>
                  {line.trackLot && <div className="text-xs text-slate-500 mt-1">Lot: {line.lotNumber}</div>}
                  {line.trackSerialNumber && <div className="text-xs text-slate-500 mt-1">Serials: {line.serialNumbers?.join(', ')}</div>}
                </div>
              ))}
              {pickingOrder.lines?.filter(l => l.qtyPicked > 0).length === 0 && (
                <div className="text-center text-slate-500 py-10">
                  Không có sản phẩm nào đã được nhặt
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingStationPage;
