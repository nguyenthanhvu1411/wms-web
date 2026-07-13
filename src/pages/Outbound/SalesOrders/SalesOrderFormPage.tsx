import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSalesOrder, useCreateSalesOrder, useUpdateSalesOrder } from './hooks/useSalesOrders';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { message, Input, Select, InputNumber, DatePicker } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import type { SalesOrder, SalesOrderLine } from '@/types/outbound';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const SalesOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: orderData, isLoading } = useSalesOrder(isEditing ? Number(id) : 0);
  const createMutation = useCreateSalesOrder();
  const updateMutation = useUpdateSalesOrder();

  const defaultOrderDate = dayjs();
  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    lines: [],
    status: 1, // Draft
    orderDate: defaultOrderDate.toISOString(),
    requestedDeliveryDate: defaultOrderDate.add(3, 'day').toISOString(),
    taxPercent: 5,
  });

  // Master Data Queries
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'active'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => masterDataApi.getProducts({ pageSize: 500 }),
  });

  const { data: uomsData } = useQuery({
    queryKey: ['uoms', 'active'],
    queryFn: () => masterDataApi.getUoms({ pageSize: 100 }),
  });

  const warehouses = warehousesData?.items || [];
  const products = productsData?.items || [];
  const uoms = uomsData?.items || [];

  useEffect(() => {
    if (isEditing && orderData) {
      setFormData({
        ...orderData,
        shippingFee: (orderData.shippingFee || 0) / 1000
      });
    }
  }, [isEditing, orderData]);

  const handleAddLine = () => {
    const newLine: Partial<SalesOrderLine> = {
      id: Date.now() * -1, // Temp ID
      productId: 0,
      productName: '',
      productSku: '',
      uomId: 0,
      uomCode: '',
      qtyOrdered: 1,
      unitPrice: 0,
      discountPercent: 0,
      lineTotal: 0,
    };
    setFormData(prev => ({
      ...prev,
      lines: [...(prev.lines || []), newLine as SalesOrderLine]
    }));
  };

  const handleRemoveLine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines?.filter((_, i) => i !== index)
    }));
  };

  const handleLineChange = (index: number, field: keyof SalesOrderLine, value: any) => {
    setFormData(prev => {
      const newLines = [...(prev.lines || [])];
      newLines[index] = { ...newLines[index], [field]: value };
      
      // Calculate line total
      const qty = newLines[index].qtyOrdered || 0;
      const price = newLines[index].unitPrice || 0;
      const discount = newLines[index].discountPercent || 0;
      newLines[index].lineTotal = qty * price * (1 - discount / 100);

      // Recalculate grand total
      const subTotal = newLines.reduce((acc, line) => acc + (line.lineTotal || 0), 0);
      const taxAmount = (subTotal * (prev.taxPercent ?? 5)) / 100;
      return {
        ...prev,
        lines: newLines,
        subTotal: subTotal,
        taxAmount: taxAmount,
        grandTotal: subTotal + (prev.shippingFee || 0) * 1000 + taxAmount,
      };
    });
  };

  const validateForm = () => {
    if (!formData.warehouseId) {
      message.error('Vui lòng chọn kho xuất');
      return false;
    }
    if (!formData.customerCode || !formData.customerName) {
      message.error('Vui lòng nhập thông tin khách hàng (Mã và Tên)');
      return false;
    }
    if (!formData.lines || formData.lines.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 dòng hàng');
      return false;
    }

    for (let i = 0; i < formData.lines.length; i++) {
      const line = formData.lines[i];
      if (!line.productId) {
        message.error(`Dòng ${i + 1}: Vui lòng chọn sản phẩm`);
        return false;
      }
      if (!line.uomId) {
        message.error(`Dòng ${i + 1}: Vui lòng chọn ĐVT`);
        return false;
      }
      if (line.qtyOrdered <= 0) {
        message.error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
        return false;
      }
      if (line.unitPrice < 0) {
        message.error(`Dòng ${i + 1}: Đơn giá không được âm`);
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      shippingFee: (formData.shippingFee || 0) * 1000
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(id), data: dataToSave as SalesOrder }, {
        onSuccess: () => navigate('/outbound/sales-orders')
      });
    } else {
      createMutation.mutate(dataToSave as SalesOrder, {
        onSuccess: () => navigate('/outbound/sales-orders')
      });
    }
  };

  if (isEditing && isLoading) return <div>Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/outbound/sales-orders')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditing ? `Cập nhật Đơn bán hàng: ${formData.orderNumber}` : 'Tạo mới Đơn bán hàng'}
          </h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          <Save size={18} />
          {isEditing ? 'Lưu cập nhật' : 'Tạo mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cột chính */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Thông tin chung</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã khách hàng <span className="text-red-500">*</span></label>
                <Input 
                  placeholder="Nhập mã khách hàng"
                  value={formData.customerCode || ''}
                  onChange={e => setFormData({ ...formData, customerCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
                <Input 
                  placeholder="Nhập tên khách hàng"
                  value={formData.customerName || ''}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kho xuất <span className="text-red-500">*</span></label>
                {/* Dùng input tạm cho demo, thực tế sẽ là Select */}
                <Select
                  className="w-full"
                  placeholder="Chọn kho xuất"
                  value={formData.warehouseId}
                  onChange={(val, option: any) => setFormData({ ...formData, warehouseId: val, warehouseCode: option.children })}
                >
                  {warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name} ({w.code})</Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại đơn</label>
                <Select
                  className="w-full"
                  value={formData.orderType || undefined}
                  onChange={val => setFormData({ ...formData, orderType: val })}
                  placeholder="Chọn loại đơn"
                  allowClear
                >
                  <Option value="Standard">Tiêu chuẩn</Option>
                  <Option value="B2B">Bán buôn (B2B)</Option>
                  <Option value="E-Commerce">Thương mại ĐT</Option>
                  <Option value="Return">Đổi trả</Option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
                <Select
                  className="w-full"
                  value={formData.priority || undefined}
                  onChange={val => setFormData({ ...formData, priority: val })}
                  placeholder="Chọn độ ưu tiên"
                  allowClear
                >
                  <Option value="High">Cao</Option>
                  <Option value="Normal">Bình thường</Option>
                  <Option value="Low">Thấp</Option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày đặt hàng</label>
                <DatePicker 
                  className="w-full" 
                  format="DD/MM/YYYY"
                  value={formData.orderDate ? dayjs(formData.orderDate) : null}
                  onChange={date => {
                    const newOrderDate = date ? date.toISOString() : undefined;
                    const newDeliveryDate = date ? date.add(3, 'day').toISOString() : undefined;
                    setFormData({ 
                      ...formData, 
                      orderDate: newOrderDate,
                      requestedDeliveryDate: newDeliveryDate
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày giao dự kiến</label>
                <DatePicker 
                  className="w-full" 
                  format="DD/MM/YYYY"
                  value={formData.requestedDeliveryDate ? dayjs(formData.requestedDeliveryDate) : null}
                  onChange={date => setFormData({ ...formData, requestedDeliveryDate: date ? date.toISOString() : undefined })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Dòng hàng (Sản phẩm) <span className="text-red-500">*</span></h3>
              <button 
                onClick={handleAddLine}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus size={16} /> Thêm sản phẩm
              </button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10">STT</th>
                    <th className="px-4 py-3 min-w-[200px]">Sản phẩm</th>
                    <th className="px-4 py-3 w-32">ĐVT</th>
                    <th className="px-4 py-3 w-28">Số lượng</th>
                    <th className="px-4 py-3 w-32">Đơn giá</th>
                    <th className="px-4 py-3 w-24">CK (%)</th>
                    <th className="px-4 py-3 w-32">Thành tiền</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {!formData.lines?.length && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        Chưa có sản phẩm nào được chọn. Vui lòng thêm sản phẩm.
                      </td>
                    </tr>
                  )}
                  {formData.lines?.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Select
                          showSearch
                          className="w-full"
                          popupMatchSelectWidth={false}
                          placeholder="Chọn SP"
                          value={line.productId || undefined}
                          onChange={(val, option: any) => {
                            const selectedProduct = products.find(p => p.id === val);
                            handleLineChange(index, 'productId', val);
                            handleLineChange(index, 'productName', selectedProduct?.name || option.children);
                            handleLineChange(index, 'productSku', selectedProduct?.sku || `SKU${val}`);
                            if (selectedProduct) {
                               if (selectedProduct.salePrice !== undefined) {
                                  handleLineChange(index, 'unitPrice', selectedProduct.salePrice);
                               }
                               if (selectedProduct.uomId) {
                                  handleLineChange(index, 'uomId', selectedProduct.uomId);
                                  const selectedUom = uoms.find(u => u.id === selectedProduct.uomId);
                                  if (selectedUom) {
                                     handleLineChange(index, 'uomCode', selectedUom.code);
                                  }
                               }
                            }
                          }}
                        >
                          {products.map(p => (
                            <Option key={p.id} value={p.id}>{p.name} ({p.sku})</Option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          className="w-full"
                          placeholder="ĐVT"
                          value={line.uomId || undefined}
                          onChange={(val, option: any) => {
                            handleLineChange(index, 'uomId', val);
                            handleLineChange(index, 'uomCode', option.children);
                          }}
                        >
                          {uoms.map(u => (
                            <Option key={u.id} value={u.id}>{u.name}</Option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <InputNumber 
                          className="w-full" 
                          min={1} 
                          value={line.qtyOrdered} 
                          onChange={val => handleLineChange(index, 'qtyOrdered', val)} 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <InputNumber 
                          className="w-full" 
                          min={0} 
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                          value={line.unitPrice} 
                          onChange={val => handleLineChange(index, 'unitPrice', val)} 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <InputNumber 
                          className="w-full" 
                          min={0} max={100} 
                          value={line.discountPercent} 
                          onChange={val => handleLineChange(index, 'discountPercent', val)} 
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {line.lineTotal?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleRemoveLine(index)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cộng tiền hàng:</span>
                  <span className="font-medium text-slate-800">{formData.subTotal?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">Phí VC (x1000 ₫):</span>
                  <InputNumber 
                    className="w-32" 
                    min={0} 
                    value={formData.shippingFee || 0} 
                    onChange={val => {
                      const fee = val as number;
                      setFormData(prev => ({
                        ...prev,
                        shippingFee: fee,
                        grandTotal: (prev.subTotal || 0) + fee * 1000 + (prev.taxAmount || 0)
                      }));
                    }} 
                  />
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">Thuế VAT (%):</span>
                  <InputNumber 
                    className="w-32" 
                    min={0} 
                    max={100}
                    value={formData.taxPercent ?? 5} 
                    onChange={val => {
                      const pct = val as number;
                      const tax = ((formData.subTotal || 0) * pct) / 100;
                      setFormData(prev => ({
                        ...prev,
                        taxPercent: pct,
                        taxAmount: tax,
                        grandTotal: (prev.subTotal || 0) + (prev.shippingFee || 0) * 1000 + tax
                      }));
                    }} 
                  />
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">Tiền thuế:</span>
                  <span className="font-medium text-slate-800">{formData.taxAmount?.toLocaleString() || 0}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between">
                  <span className="font-medium text-slate-800">Tổng cộng:</span>
                  <span className="text-lg font-bold text-primary">{formData.grandTotal?.toLocaleString() || 0} {formData.currency || 'VND'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phụ */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Thông tin liên hệ & Giao hàng</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <Input 
                  placeholder="SĐT người nhận"
                  value={formData.customerPhone || ''}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input 
                  type="email"
                  placeholder="Email người nhận"
                  value={formData.customerEmail || ''}
                  onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ giao hàng (Số nhà, đường)</label>
                <Input 
                  placeholder="Số nhà, đường..."
                  value={formData.shippingAddress || ''}
                  onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tỉnh/Thành</label>
                  <Input 
                    placeholder="Tỉnh/Thành phố"
                    value={formData.shippingProvince || ''}
                    onChange={e => setFormData({ ...formData, shippingProvince: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quận/Huyện</label>
                  <Input 
                    placeholder="Quận/Huyện"
                    value={formData.shippingCity || ''}
                    onChange={e => setFormData({ ...formData, shippingCity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quốc gia</label>
                  <Input 
                    placeholder="Quốc gia"
                    value={formData.shippingCountry || ''}
                    onChange={e => setFormData({ ...formData, shippingCountry: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Ghi chú khác</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tham chiếu ngoài (Mã đơn đối tác)</label>
                <Input 
                  placeholder="Ví dụ: SPX-123456 (Nếu để trống sẽ tự động sinh SPX+6 số)"
                  value={formData.externalReference || ''}
                  onChange={e => setFormData({ ...formData, externalReference: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiền tệ</label>
                <Select
                  className="w-full"
                  value={formData.currency || 'VND'}
                  onChange={val => setFormData({ ...formData, currency: val })}
                >
                  <Option value="VND">VND</Option>
                  <Option value="USD">USD</Option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú đơn hàng</label>
                <TextArea 
                  rows={4}
                  placeholder="Ghi chú thêm về đơn hàng..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderFormPage;
