import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Barcode } from 'lucide-react';
import clsx from 'clsx';

export interface EnterpriseFilterState {
  keyword?: string;
  barcode?: string;
  [key: string]: any;
}

interface EnterpriseFilterProps {
  onSearch: (filters: EnterpriseFilterState) => void;
  onClear: () => void;
  children?: React.ReactNode;
  placeholder?: string;
  showBarcode?: boolean;
}

export const EnterpriseFilter: React.FC<EnterpriseFilterProps> = ({ 
  onSearch, 
  onClear, 
  children,
  placeholder = "Tìm kiếm theo mã, từ khóa...",
  showBarcode = true
}) => {
  const [filters, setFilters] = useState<EnterpriseFilterState>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, keyword: e.target.value }));
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, barcode: e.target.value }));
  };

  return (
    <div className="bg-white border-2 border-slate-900 mb-6 transition-all duration-200">
      <div className="flex items-center gap-2 p-2">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2 relative">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={filters.keyword || ''}
              onChange={handleKeywordChange}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>
          
          {showBarcode && (
            <div className="relative w-48 hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Barcode size={18} />
              </div>
              <input
                type="text"
                value={filters.barcode || ''}
                onChange={handleBarcodeChange}
                placeholder="Quét mã vạch..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors font-mono"
              />
            </div>
          )}
          
          <button 
            type="submit"
            className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-none hover:bg-slate-800 transition-colors"
          >
            TÌM KIẾM
          </button>
        </form>

        {children && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={clsx(
              "px-4 py-2 border-2 text-sm font-semibold rounded-none transition-colors flex items-center gap-2",
              isExpanded 
                ? "border-slate-900 bg-slate-100 text-slate-900" 
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            )}
          >
            <Filter size={16} /> LỌC 
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {isExpanded && children && (
        <div className="p-4 border-t-2 border-slate-900 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
            <button 
              onClick={handleClear}
              className="px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors flex items-center gap-1 border border-transparent rounded-none"
            >
              <X size={16} /> XÓA BỘ LỌC
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
