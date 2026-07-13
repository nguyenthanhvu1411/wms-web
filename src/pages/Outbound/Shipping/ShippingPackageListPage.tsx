import { useState, useMemo } from 'react';
import { useShippingPackages, useShipPackage, useMarkPackageDelivered } from './hooks/useShippingPackages';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Send, Eye, CheckCircle } from 'lucide-react';
import { ShippingPackageStatus, shippingPackageStatusLabel, SalesOrderStatus } from '@/types/wms-enums';
import type { ShippingPackage } from '@/types/outbound';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Modal, Input } from 'antd';

const ShippingPackageListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useShippingPackages({ page, pageSize: 10, search: searchTerm });
  const shipMutation = useShipPackage();
  const deliveredMutation = useMarkPackageDelivered();

  const packages = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [activePackageId, setActivePackageId] = useState<number | null>(null);
  const [dispatchData, setDispatchData] = useState({
    trackingNumber: '',
    carrierName: '',
    notes: ''
  });

  const getStatusString = (item: ShippingPackage) => {
    // Đơn hàng đã đóng → hiển ưu tiên cao nhất
    if (item.salesOrderStatus === SalesOrderStatus.Closed) return 'Completed';
    switch(item.status) {
      case ShippingPackageStatus.Packed: return 'Pending';
      case ShippingPackageStatus.Dispatched: return 'InProgress';
      case ShippingPackageStatus.InTransit: return 'InProgress';
      case ShippingPackageStatus.Delivered: return 'Completed';
      default: return 'Pending';
    }
  };

  const getStatusLabel = (item: ShippingPackage): string => {
    if (item.salesOrderStatus === SalesOrderStatus.Closed) return 'Đã đóng';
    return shippingPackageStatusLabel[item.status as unknown as ShippingPackageStatus];
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

  const generateTrackingNumber = (carrierName?: string) => {
    const code = getCarrierCode(carrierName);
    const dateStr = format(new Date(), 'yyMMdd');
    const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
    return `${code}${dateStr}${randomStr}`;
  };

  const handleOpenDispatch = (id: number) => {
    setActivePackageId(id);
    const pkg = packages.find(p => p.id === id);
    const tracking = pkg?.trackingNumber || generateTrackingNumber(pkg?.carrierName);
    setDispatchData({
      trackingNumber: tracking,
      carrierName: pkg?.carrierName || '',
      notes: pkg?.notes || ''
    });
    setDispatchModalVisible(true);
  };

  const handleConfirmDispatch = () => {
    if (activePackageId) {
      shipMutation.mutate(
        { id: activePackageId, data: dispatchData },
        {
          onSuccess: () => {
            setDispatchModalVisible(false);
            setActivePackageId(null);
          }
        }
      );
    }
  };

  const columns = [
    { header: 'Mã kiện hàng', accessorKey: 'packageNumber' as keyof ShippingPackage, className: 'font-mono text-primary font-medium' },
    { 
      header: 'Đơn bán hàng',
      cell: (item: ShippingPackage) => (
        <span className="font-mono text-slate-700 text-xs">{item.salesOrderNumber || '-'}</span>
      )
    },
    { header: 'Hãng vận chuyển', accessorKey: 'carrierName' as keyof ShippingPackage },
    {
      header: 'Dịch vụ',
      cell: (item: ShippingPackage) => (
        <span className="text-slate-600 text-sm">{item.carrierService || '-'}</span>
      )
    },
    { header: 'Mã vận đơn', accessorKey: 'trackingNumber' as keyof ShippingPackage, className: 'font-mono' },
    {
      header: 'Thông số kiện',
      cell: (item: ShippingPackage) => {
        const hasWeight = item.weightKg !== undefined && item.weightKg !== null;
        const hasDim = item.lengthCm && item.widthCm && item.heightCm;
        return (
          <div className="text-xs text-slate-600">
            {hasWeight && <div>{item.weightKg} kg</div>}
            {hasDim && <div className="text-slate-400 font-mono">{item.lengthCm}x{item.widthCm}x{item.heightCm} cm</div>}
            {!hasWeight && !hasDim && '-'}
          </div>
        );
      }
    },
    { 
      header: 'Ngày đóng gói', 
      cell: (item: ShippingPackage) => item.packedAt ? format(new Date(item.packedAt), 'dd/MM/yyyy HH:mm') : '-'
    },
    { 
      header: 'Trạng thái', 
      cell: (item: ShippingPackage) => (
        <StatusBadge 
          status={getStatusString(item)} 
          text={getStatusLabel(item)} 
        />
      )
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: ShippingPackage) => (
        <div className="flex justify-end gap-2">
          {item.status === ShippingPackageStatus.Packed && (
            <button 
              onClick={() => handleOpenDispatch(item.id)}
              className="p-1.5 text-success hover:bg-success/10 rounded transition-colors" title="Bàn giao ĐVVC (Dispatch)"
            >
              <Send size={18} />
            </button>
          )}
          {(item.status === ShippingPackageStatus.Dispatched || item.status === ShippingPackageStatus.InTransit) && (
            <button 
              onClick={() => {
                if(window.confirm('Xác nhận kiện hàng đã được giao thành công?')) {
                  deliveredMutation.mutate(item.id);
                }
              }}
              className="p-1.5 text-success hover:bg-success/10 rounded transition-colors" title="Xác nhận đã giao (Delivered)"
            >
              <CheckCircle size={18} />
            </button>
          )}
          <button 
            onClick={() => navigate(`/outbound/shipping/${item.id}`)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors" title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Đóng gói / Giao hàng</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các kiện hàng đã đóng gói và giao cho ĐVVC</p>
        </div>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={packages}
        pageIndex={page}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <Modal
        title="Bàn giao cho đơn vị vận chuyển"
        open={dispatchModalVisible}
        onCancel={() => setDispatchModalVisible(false)}
        onOk={handleConfirmDispatch}
        confirmLoading={shipMutation.isPending}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã vận đơn</label>
            <Input 
              placeholder="Nhập mã vận đơn"
              value={dispatchData.trackingNumber}
              onChange={e => setDispatchData({ ...dispatchData, trackingNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị vận chuyển</label>
            <Input 
              placeholder="Ví dụ: GHTK, Viettel Post"
              value={dispatchData.carrierName}
              onChange={e => setDispatchData({ ...dispatchData, carrierName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <Input.TextArea 
              rows={3}
              placeholder="Ghi chú thêm..."
              value={dispatchData.notes}
              onChange={e => setDispatchData({ ...dispatchData, notes: e.target.value })}
            />
          </div>
          <div className="bg-warning/10 border border-warning/20 p-3 rounded-md mt-4">
            <p className="text-sm text-warning font-medium">⚠️ Cảnh báo Xuất kho (Dispatch)</p>
            <p className="text-xs text-warning mt-1">
              Hành động này sẽ thực hiện <strong>GIẢM QtyOnHand</strong> và <strong>GIẢM QtyReserved</strong> tương ứng cho các sản phẩm trong kiện. Không thể hoàn tác.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShippingPackageListPage;



