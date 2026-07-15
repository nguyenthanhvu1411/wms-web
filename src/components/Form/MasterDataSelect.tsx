import React from 'react';
import AsyncSelect from 'react-select/async';
import { useController, type Control } from 'react-hook-form';
import { masterDataApi } from '@/api/masterDataApi';

interface SelectOption {
  value: number;
  label: string;
  data?: any;
}

interface MasterDataSelectProps {
  name: string;
  control: Control<any>;
  label: string;
  type: 'supplier' | 'product' | 'warehouse' | 'location' | 'uom' | 'category';
  placeholder?: string;
  required?: boolean;
  warehouseId?: number; // Filter for locations
  isClearable?: boolean;
  onChangeData?: (data: any) => void;
}

export const MasterDataSelect: React.FC<MasterDataSelectProps> = ({
  name,
  control,
  label,
  type,
  placeholder = 'Tìm kiếm...',
  required = false,
  warehouseId,
  isClearable = true,
  onChangeData,
}) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: { required: required ? 'Trường này là bắt buộc' : false },
  });

  const [selectedOption, setSelectedOption] = React.useState<SelectOption | null>(null);

  React.useEffect(() => {
    const fetchLabel = async (val: any) => {
      try {
        let label = `Đã chọn (${val})`;
        switch (type) {
          case 'supplier':
            const sup = await masterDataApi.getSupplierById(val);
            label = `${sup.code} - ${sup.name}`;
            break;
          case 'product':
            const prod = await masterDataApi.getProductById(val);
            label = `${prod.sku} - ${prod.name}`;
            break;
          case 'warehouse':
            const wh = await masterDataApi.getWarehouseById(val);
            label = `${wh.code} - ${wh.name}`;
            break;
          case 'location':
            const loc = await masterDataApi.getLocationById(val);
            label = loc.code;
            break;
          case 'uom':
            const uom = await masterDataApi.getUomById(val);
            label = `${uom.code} - ${uom.name}`;
            break;
          case 'category':
            const cat = await masterDataApi.getCategoryById(val);
            label = `${cat.code} - ${cat.name}`;
            break;
        }
        setSelectedOption({ value: val, label });
      } catch {
        setSelectedOption({ value: val, label: `Đã chọn (${val})` });
      }
    };

    if (!value) {
      setSelectedOption(null);
    } else if (typeof value === 'object' && value !== null) {
      // In case an object is passed, sync it to primitive in the form
      setSelectedOption(value as SelectOption);
      onChange((value as SelectOption).value);
    } else if (value && (!selectedOption || selectedOption.value !== value)) {
      // Fetch label from API
      fetchLabel(value);
    }
  }, [value, selectedOption, onChange, type]);

  const handleChange = (option: any) => {
    setSelectedOption(option);
    onChange(option ? option.value : null);
    if (onChangeData) {
      onChangeData(option ? option.data : null);
    }
  };

  const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
    try {
      const params = { keyword: inputValue, search: inputValue, pageIndex: 1, pageSize: 20 };
      let options: SelectOption[] = [];

      switch (type) {
        case 'supplier':
          const suppliers = await masterDataApi.getSuppliers(params);
          options = suppliers.items.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));
          break;
        case 'product':
          const products = await masterDataApi.getProducts(params);
          options = products.items.map((p) => {
            const displayBarcode = p.defaultBarcode || (p.barcodes && p.barcodes.length > 0 ? p.barcodes[0].barcode : '');
            const barcodeInfo = displayBarcode ? ` [Mã vạch: ${displayBarcode}]` : '';
            return { value: p.id, label: `${p.sku} - ${p.name}${barcodeInfo}`, data: p };
          });
          break;
        case 'warehouse':
          const warehouses = await masterDataApi.getWarehouses(params);
          options = warehouses.items.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
          break;
        case 'location':
          const locations = await masterDataApi.getLocations({ ...params, warehouseId });
          options = locations.items.map((l) => ({ value: l.id, label: `${l.code}` }));
          break;
        case 'uom':
          const uoms = await masterDataApi.getUoms(params);
          options = uoms.items.map((u) => ({ value: u.id, label: `${u.code} - ${u.name}` }));
          break;
        case 'category':
          const categories = await masterDataApi.getCategories(params);
          options = categories.items.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
          break;
      }
      return options;
    } catch (err) {
      console.error('Error loading options for', type, err);
      return [];
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        value={selectedOption}
        onChange={handleChange}
        onBlur={onBlur}
        ref={ref}
        placeholder={placeholder}
        isClearable={isClearable}
        noOptionsMessage={() => 'Không tìm thấy dữ liệu'}
        loadingMessage={() => 'Đang tìm kiếm...'}
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: '42px',
            borderRadius: '0.5rem',
            borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#e2e8f0',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
            '&:hover': {
              borderColor: error ? '#ef4444' : '#3b82f6',
            },
            backgroundColor: 'var(--color-background)',
          }),
          menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden',
            width: 'max-content',
            minWidth: '100%',
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'transparent',
            color: state.isSelected ? 'white' : 'var(--color-text-primary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            '&:active': {
              backgroundColor: '#2563eb',
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
          }),
          placeholder: (base) => ({
            ...base,
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
          }),
        }}
      />
      {error && <p className="mt-1 text-sm text-danger">{error.message}</p>}
    </div>
  );
};
