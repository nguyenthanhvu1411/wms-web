import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useCreateCustomerReturn, useCustomerReturn, useCompleteCustomerReturn } from './hooks/useCustomerReturns';
import { outboundApi } from '@/api/outboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { ArrowLeft, Save, Play, Package, Hash, User, MapPin, Truck, Calendar, Tag } from 'lucide-react';
import { message, Spin, Select, Upload } from 'antd';
import { Upload as UploadIcon } from 'lucide-react';
const { Dragger } = Upload;
import type { CreateReturnOrderRequest } from '@/types/operations';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ReturnStatus, returnStatusLabel, salesOrderStatusLabel } from '@/types/wms-enums';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';

const CustomerReturnFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isViewMode = !!id;
  const returnId = Number(id);

  const { data: returnData, isLoading } = useCustomerReturn(returnId);
  const createMutation = useCreateCustomerReturn();
  const completeMutation = useCompleteCustomerReturn();

  // Fetch Sales Orders for dropdown
  const { data: salesOrdersData, isLoading: isLoadingSOs } = useQuery({
    queryKey: ['salesOrdersForReturn'],
    queryFn: () => outboundApi.getSalesOrders({ pageSize: 50 }),
    enabled: !isViewMode
  });

  const [formData, setFormData] = useState<Partial<CreateReturnOrderRequest>>({
    lines: []
  });

  // Fetch specific SO details when selected
  const { data: selectedSoDetails, isFetching: isFetchingSo } = useQuery({
    queryKey: ['salesOrderDetailsForReturn', formData.salesOrderId],
    queryFn: () => outboundApi.getSalesOrder(formData.salesOrderId!),
    enabled: !!formData.salesOrderId && !isViewMode
  });

  // Fetch product masterdata
  const productIds = Array.from(new Set(formData.lines?.map(l => l.productId) || []));
  const productQueries = useQueries({
    queries: productIds.map(id => ({
      queryKey: ['productMasterData', id],
      queryFn: () => masterDataApi.getProductById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000 // 5 mins
    }))
  });
  
  const productsMap = productQueries.reduce((acc, query) => {
    if (query.data) acc[query.data.id] = query.data;
    return acc;
  }, {} as Record<number, any>);

  // Fetch locations
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', selectedSoDetails?.warehouseId],
    queryFn: () => masterDataApi.getLocations({ warehouseId: selectedSoDetails?.warehouseId, pageSize: 100 }),
    enabled: !!selectedSoDetails?.warehouseId && !isViewMode
  });

  useEffect(() => {
    if (selectedSoDetails && !isViewMode) {
      const newLines = selectedSoDetails.lines.map(line => ({
        salesOrderLineId: line.id,
        productId: line.productId,
        productSku: line.productSku,
        productName: line.productName,
        uomId: line.uomId,
        uomCode: line.uomCode,
        locationId: undefined, 
        locationCode: '',
        qtyOrdered: line.qtyOrdered, // Expected original order qty
        qtyDelivered: line.qtyShipped,
        qtyReturnedBefore: line.qtyReturnedBefore || 0, // Fallback if backend doesn't provide
        qtyExpected: line.qtyShipped > 0 ? line.qtyShipped : 0, 
        qtyMax: line.qtyShipped,
        unitPrice: line.unitPrice || 0,
        amount: (line.qtyShipped > 0 ? line.qtyShipped : 0) * (line.unitPrice || 0),
        lotNumber: '', 
        serialNumber: '', 
        reasonCode: '',
        notes: ''
      }));
      setFormData(prev => ({
        ...prev,
        lines: newLines as any
      }));
      
      // Developer hint for missing DTO fields
      console.log("TODO Backend: Provide QtyReturnedBefore, CustomerCode, CustomerType, Carrier, TrackingNumber, SalesPerson in the API response.");
    }
  }, [selectedSoDetails, isViewMode]);

  useEffect(() => {
    if (isViewMode && returnData) {
      setFormData({
        salesOrderId: returnData.salesOrderId,
        reason: returnData.reason,
        notes: returnData.notes,
        carrierName: returnData.carrierName,
        trackingNumber: returnData.trackingNumber,
        vehicleNumber: returnData.vehicleNumber,
        driverName: returnData.driverName,
        orderType: returnData.orderType,
        lines: returnData.lines?.map((line: any) => ({
          salesOrderLineId: line.salesOrderLineId,
          productId: line.productId,
          productSku: line.productSku,
          productName: line.productName,
          uomId: line.uomId,
          uomCode: line.uomCode,
          locationId: line.locationId,
          locationCode: line.locationCode,
          qtyOrdered: line.qtyExpected, 
          qtyDelivered: line.qtyExpected,
          qtyExpected: line.qtyExpected,
          qtyReceived: line.qtyReceived,
          qtyPassed: line.qtyPassed,
          qtyFailed: line.qtyFailed,
          unitPrice: line.unitPrice || 0, 
          amount: line.amount || 0,
          lotNumber: line.lotNumber,
          serialNumber: line.serialNumber,
          reasonCode: line.reasonCode || '',
          notes: line.notes
        })) as any
      });
      
      console.log("TODO Backend: Provide UnitPrice, Amount in ReturnDetail API.");
    }
  }, [isViewMode, returnData]);

  const handleUpdateLine = (index: number, field: string, value: any) => {
    const updatedLines = [...(formData.lines || [])] as any[];
    const currentLine = updatedLines[index];
    
    currentLine[field] = value;
    
    if (field === 'qtyExpected') {
       currentLine.amount = value * (currentLine.unitPrice || 0);
    }
    if (field === 'unitPrice') {
       currentLine.amount = (currentLine.qtyExpected || 0) * value;
    }
    
    setFormData({ ...formData, lines: updatedLines });
  };

  const handleSave = () => {
    if (!formData.salesOrderId) {
      message.error('Vui lòng chọn Đơn bán hàng (Sales Order)');
      return;
    }
    
    const activeLines = formData.lines?.filter(l => l.qtyExpected > 0);
    
    if (!activeLines || activeLines.length === 0) {
      message.error('Phiếu trả hàng phải có ít nhất 1 sản phẩm có số lượng trả lớn hơn 0');
      return;
    }

    if (activeLines.some(l => !l.locationId)) {
      message.error('Vui lòng chọn Vị trí nhận hàng (Location) cho tất cả các sản phẩm được trả.');
      return;
    }

    const payload: CreateReturnOrderRequest = {
      salesOrderId: formData.salesOrderId,
      reason: formData.reason,
      notes: formData.notes,
      carrierName: formData.carrierName,
      trackingNumber: formData.trackingNumber,
      vehicleNumber: formData.vehicleNumber,
      driverName: formData.driverName,
      orderType: formData.orderType,
      lines: activeLines.map(l => ({
        salesOrderLineId: l.salesOrderLineId,
        productId: l.productId,
        uomId: l.uomId,
        locationId: l.locationId,
        qtyExpected: l.qtyExpected,
        lotNumber: l.lotNumber,
        expiryDate: l.expiryDate,
        serialNumber: l.serialNumber,
        reasonCode: l.reasonCode,
        notes: l.notes
      }))
    };

    createMutation.mutate(payload, {
      onSuccess: () => navigate('/returns/customer')
    });
  };

  const handleComplete = () => {
    completeMutation.mutate(returnId);
  };

  if (isViewMode && isLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const status = returnData?.status as ReturnStatus;

  // Calculate footer totals
  const totalSKUs = formData.lines?.filter(l => l.qtyExpected > 0).length || 0;
  const totalQty = formData.lines?.reduce((sum, l) => sum + (l.qtyExpected || 0), 0) || 0;
  const totalAmount = formData.lines?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;

  return (
    <div className="max-w-[1400px] mx-auto pb-24">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/returns/customer')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {isViewMode ? `Hoàn Trả: ${returnData?.returnNumber}` : 'Tạo mới Phiếu trả hàng'}
              </h1>
              {isViewMode && (
                <StatusBadge 
                  status={Object.keys(ReturnStatus).find(key => (ReturnStatus as any)[key] === status) || 'Draft'} 
                  text={returnStatusLabel[status] || 'Unknown'} 
                />
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Lập danh sách hàng khách dự kiến trả</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isViewMode ? (
              <button
                onClick={handleSave}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
                disabled={createMutation.isPending}
              >
                <Save size={18} /> TẠO PHIẾU HOÀN TRẢ
              </button>
          ) : (
            status !== ReturnStatus.Completed && status !== ReturnStatus.Closed && status !== ReturnStatus.Cancelled && (
              <PermissionGuard permissions="Return.Complete">
                <button
                  onClick={handleComplete}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                  disabled={completeMutation.isPending}
                >
                  <Play size={18} /> HOÀN THÀNH
                </button>
              </PermissionGuard>
            )
          )}
        </div>
      </div>

      {/* Main Info Box */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Package className="text-slate-500" size={18} />
          <h3 className="font-semibold text-slate-800">Thông tin chung (Header)</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Đơn bán hàng (Sales Order) {!isViewMode && <span className="text-red-500">*</span>}
            </label>
            {isViewMode ? (
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-100 text-slate-700 font-medium"
                value={returnData?.salesOrderNumber || `ID: ${formData.salesOrderId}`}
                disabled
              />
            ) : (
              <Select
                showSearch
                placeholder="Chọn đơn bán hàng đã giao..."
                className="w-full"
                style={{ height: '42px' }}
                loading={isLoadingSOs}
                disabled={isViewMode}
                value={formData.salesOrderId}
                onChange={val => setFormData({ ...formData, salesOrderId: val })}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={salesOrdersData?.items.map(so => ({
                  value: so.id,
                  label: `${so.orderNumber} - ${so.customerName}`
                }))}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Lý do trả hàng</label>
            <Select
              className="w-full"
              style={{ height: '42px' }}
              placeholder="Chọn lý do..."
              value={formData.reason || undefined}
              onChange={val => setFormData({ ...formData, reason: val })}
              disabled={isViewMode}
              options={[
                { value: 'Sản phẩm lỗi', label: 'Sản phẩm lỗi' },
                { value: 'Sai sản phẩm', label: 'Sai sản phẩm' },
                { value: 'Khách không nhận', label: 'Khách không nhận' },
                { value: 'Lý do khác', label: 'Lý do khác' },
              ]}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại đơn</label>
            <Select
              className="w-full"
              style={{ height: '42px' }}
              placeholder="Chọn loại đơn..."
              value={formData.orderType || 'Standard'}
              onChange={val => setFormData({ ...formData, orderType: val })}
              disabled={isViewMode}
              options={[
                { value: 'Standard', label: 'Tiêu chuẩn' },
                { value: 'Express', label: 'Hỏa tốc' },
                { value: 'Bulk', label: 'Hàng rời' },
              ]}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">ĐV Vận chuyển</label>
            <Select
              className="w-full"
              style={{ height: '42px' }}
              placeholder="Chọn ĐV Vận chuyển..."
              value={formData.carrierName || undefined}
              onChange={val => {
                const newTracking = formData.trackingNumber || `RET-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                setFormData({ ...formData, carrierName: val, trackingNumber: newTracking })
              }}
              disabled={isViewMode}
              options={[
                { value: 'Viettel Post', label: 'Viettel Post' },
                { value: 'Giao Hàng Tiết Kiệm', label: 'Giao Hàng Tiết Kiệm' },
                { value: 'Giao Hàng Nhanh', label: 'Giao Hàng Nhanh' },
                { value: 'VNPost', label: 'VNPost' },
                { value: 'Ahamove', label: 'Ahamove' },
                { value: 'Shopee Express', label: 'Shopee Express' },
                { value: 'J&T Express', label: 'J&T Express' },
              ]}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã vận đơn</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500 h-[42px]"
              placeholder="Hệ thống tự sinh..."
              value={formData.trackingNumber || ''}
              disabled
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài xế</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500 h-[42px]"
              placeholder="Tên tài xế..."
              value={formData.driverName || ''}
              onChange={e => setFormData({ ...formData, driverName: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Biển số xe</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500 h-[42px]"
              placeholder="VD: 51H-123.45"
              value={formData.vehicleNumber || ''}
              onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500 h-[42px]"
              placeholder="Ghi chú thêm..."
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Enhanced SO Details Header */}
        {selectedSoDetails && !isViewMode && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><User size={12}/> Khách hàng</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.customerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mã KH (Customer Code)</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.customerCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Loại khách (Type)</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.customerType || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">SĐT / Email</p>
              <p className="font-medium text-slate-800 text-sm">
                {selectedSoDetails.customerPhone || selectedSoDetails.customerEmail ? 
                  `${selectedSoDetails.customerPhone || ''} ${selectedSoDetails.customerEmail ? `/ ${selectedSoDetails.customerEmail}` : ''}` 
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Địa chỉ giao hàng</p>
              <p className="font-medium text-slate-800 text-sm truncate" title={selectedSoDetails.shippingAddress}>{selectedSoDetails.shippingAddress || '—'}</p>
            </div>
            
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Tag size={12}/> Trạng thái SO</p>
              <div className="mt-1"><StatusBadge status={'default'} text={salesOrderStatusLabel[selectedSoDetails.status] || 'Unknown'} /></div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Kho nhận</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.warehouseCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Ngày đơn hàng</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.orderDate ? new Date(selectedSoDetails.orderDate).toLocaleDateString('vi-VN') : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Ngày giao hàng (Delivery)</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.actualDeliveryDate ? new Date(selectedSoDetails.actualDeliveryDate).toLocaleDateString('vi-VN') : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Người bán (Sales Person)</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.salesPerson || '—'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Truck size={12}/> Carrier</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.carrierName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Hash size={12}/> Tracking Number</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.trackingNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tổng tiền đơn</p>
              <p className="font-medium text-slate-800 text-blue-700">{selectedSoDetails.grandTotal?.toLocaleString('vi-VN')} đ</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Created By</p>
              <p className="font-medium text-slate-800">{selectedSoDetails.createdBy || '—'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Danh sách sản phẩm hoàn trả</h3>
          {isFetchingSo && <Spin size="small" />}
        </div>
        <div className="p-0">
          {!formData.lines || formData.lines.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">
              {!formData.salesOrderId 
                ? 'Vui lòng chọn đơn bán hàng để tải danh sách sản phẩm.' 
                : 'Đơn hàng không có sản phẩm nào có thể hoàn trả.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                    <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">SKU</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Barcode</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3 text-center">UOM</th>
                    <th className="px-4 py-3">Vị trí nhận</th>
                    <th className="px-4 py-3 text-right">Qty Giao</th>
                    <th className="px-4 py-3 text-right">Qty Đã trả</th>
                    <th className="px-4 py-3 text-right">Còn đc trả</th>
                    <th className="px-4 py-3 text-right bg-blue-50">Qty Trả Lần Này</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                    <th className="px-4 py-3">Lot / EXP</th>
                    <th className="px-4 py-3">Serial</th>
                    <th className="px-4 py-3">Lý do</th>
                    <th className="px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.lines.map((line: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 group-hover:bg-slate-50">
                        {line.productSku}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={line.productName}>
                        {line.productName || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {productsMap[line.productId]?.defaultBarcode || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {productsMap[line.productId]?.categoryName || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">{line.uomCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {isViewMode ? (line.locationCode || '—') : (
                          <Select
                            className="min-w-[200px]"
                            placeholder="Chọn vị trí..."
                            loading={isLoadingLocations}
                            value={line.locationId || undefined}
                            onChange={(val) => {
                              const loc = locationsData?.items.find(l => l.id === val);
                              handleUpdateLine(index, 'locationId', val);
                              handleUpdateLine(index, 'locationCode', loc?.code || '');
                            }}
                            options={locationsData?.items.map(l => ({
                              value: l.id,
                              label: l.code
                            }))}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">{line.qtyDelivered || line.qtyMax || 0}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">{line.qtyReturnedBefore || 0}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                        {(line.qtyDelivered || line.qtyMax || 0) - (line.qtyReturnedBefore || 0)}
                      </td>
                      <td className="px-4 py-2 bg-blue-50/30">
                        <input
                          type="number"
                          min="0"
                          max={!isViewMode ? ((line.qtyDelivered || line.qtyMax || 0) - (line.qtyReturnedBefore || 0)) : undefined}
                          className="w-full min-w-[80px] px-2 py-1.5 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 text-right font-bold text-blue-700 disabled:bg-transparent disabled:border-transparent outline-none transition-shadow bg-white"
                          value={line.qtyExpected || 0}
                          onChange={e => handleUpdateLine(index, 'qtyExpected', Number(e.target.value))}
                          disabled={isViewMode}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {isViewMode ? (line.unitPrice ? line.unitPrice.toLocaleString('vi-VN') : '—') : (
                          <input
                            type="number"
                            className="w-[100px] px-2 py-1 border border-slate-300 rounded text-right"
                            value={line.unitPrice || 0}
                            onChange={e => handleUpdateLine(index, 'unitPrice', Number(e.target.value))}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">
                        {line.amount ? line.amount.toLocaleString('vi-VN') : '0'} đ
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 flex gap-1 items-center">
                        {isViewMode ? (
                          <div className="flex flex-col">
                             <span className="font-medium">{line.lotNumber || '—'}</span>
                             {line.expiryDate && <span className="text-xs text-slate-400">{new Date(line.expiryDate).toLocaleDateString('vi-VN')}</span>}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                             <input type="text" className="w-[120px] px-2 py-1 border border-slate-300 rounded text-xs" value={line.lotNumber || ''} onChange={e => handleUpdateLine(index, 'lotNumber', e.target.value)} placeholder="Nhập Lot..." />
                             <input type="date" className="w-[120px] px-2 py-1 border border-slate-300 rounded text-xs" value={line.expiryDate ? new Date(line.expiryDate).toISOString().split('T')[0] : ''} onChange={e => handleUpdateLine(index, 'expiryDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)} title="Hạn sử dụng" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isViewMode ? (line.serialNumber || '—') : (
                           <button className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 rounded text-xs font-medium border border-slate-300 transition-colors">
                             Scan Serial
                           </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                         {isViewMode ? (line.reasonCode || '—') : (
                           <select 
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-[120px]"
                            value={line.reasonCode || ''}
                            onChange={e => handleUpdateLine(index, 'reasonCode', e.target.value)}
                           >
                             <option value="">Lý do...</option>
                             <option value="ERR">Lỗi SP</option>
                             <option value="DAM">Hư hỏng</option>
                           </select>
                         )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isViewMode ? (line.notes || '—') : <input type="text" className="w-[150px] px-2 py-1 border border-slate-300 rounded text-xs" value={line.notes || ''} onChange={e => handleUpdateLine(index, 'notes', e.target.value)} placeholder="Ghi chú..." />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Attachments UI Mockup */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
         <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Tệp đính kèm (Attachments)</h3>
         </div>
         <div className="p-6">
            <Dragger
              name="file"
              multiple={true}
              listType="picture"
              action="/api/upload" // Fake endpoint for UI interaction
              customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 1000)}
              onChange={(info) => {
                const { status } = info.file;
                if (status === 'done') {
                  message.success(`${info.file.name} tải lên thành công.`);
                } else if (status === 'error') {
                  message.error(`${info.file.name} tải lên thất bại.`);
                }
              }}
            >
               <p className="ant-upload-drag-icon">
                 <UploadIcon className="mx-auto text-slate-400" size={48} />
               </p>
               <p className="ant-upload-text">Kéo thả file vào đây hoặc Chọn File</p>
               <p className="ant-upload-hint text-xs text-slate-400 mt-2">
                 Hỗ trợ Photo, Video, PDF, Invoice, QC Image (Max 10MB)
               </p>
            </Dragger>
         </div>
      </div>

      {/* Footer Fixed Summary */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 px-6 z-50 flex justify-between items-center">
         <div className="flex gap-8">
            <div>
               <p className="text-xs text-slate-500">Tổng mã sản phẩm (SKU)</p>
               <p className="font-bold text-lg text-slate-800">{totalSKUs}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500">Tổng số lượng (Qty)</p>
               <p className="font-bold text-lg text-blue-600">{totalQty}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500">Tổng tiền hoàn trả</p>
               <p className="font-bold text-lg text-emerald-600">{totalAmount.toLocaleString('vi-VN')} đ</p>
            </div>
         </div>
         <div>
            {/* Same Action Button as Header */}
            {!isViewMode ? (
                <button
                  onClick={handleSave}
                  className="bg-primary text-white px-8 py-3 rounded-lg text-base font-bold hover:bg-primary-hover transition-colors shadow-md flex items-center gap-2"
                  disabled={createMutation.isPending}
                >
                  <Save size={20} /> TẠO PHIẾU
                </button>
            ) : null}
         </div>
      </div>
    </div>
  );
};

export default CustomerReturnFormPage;
