import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedFilterProps {
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  children?: React.ReactNode; // For additional filter fields (Selects, DateRange)
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ onSearch, onClear, children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm mb-6 transition-all duration-200">
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo mã, tên..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </form>

        <button 
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          Tìm kiếm
        </button>

        {children && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-background border border-border text-text-secondary text-sm font-medium rounded-lg hover:bg-slate-100 hover:text-text-primary transition-colors flex items-center gap-2"
          >
            <Filter size={16} /> Lọc nâng cao 
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {isExpanded && children && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
          </div>
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleClear}
              className="px-4 py-2 text-text-secondary hover:text-danger text-sm font-medium transition-colors flex items-center gap-1"
            >
              <X size={16} /> Xóa bộ lọc
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
