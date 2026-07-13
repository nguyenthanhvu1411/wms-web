import React from 'react';
import { Lock, Wand2 } from 'lucide-react';

interface AutoCodeInputProps {
  label?: string;
  prefix?: string; // Example: "PO-", "SKU-"
  isManual?: boolean;
  value?: string;
  onChange?: (val: string) => void;
  onGenerate?: () => void;
  error?: string;
}

export const AutoCodeInput: React.FC<AutoCodeInputProps> = ({ 
  label = 'Mã (Code)', 
  prefix,
  isManual = false,
  value,
  onChange,
  onGenerate,
  error
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Lock size={16} />
          </div>
          <input
            type="text"
            disabled={!isManual}
            value={value || (isManual ? '' : 'Hệ thống tự động sinh sau khi lưu')}
            onChange={(e) => onChange && onChange(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-colors ${
              !isManual 
                ? 'bg-slate-100 border border-border text-text-muted cursor-not-allowed italic'
                : `bg-background border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border'
                  }`
            }`}
          />
          {!isManual && prefix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs font-mono text-text-muted bg-white px-2 py-0.5 rounded border border-border">
                {prefix}XXXXX
              </span>
            </div>
          )}
        </div>
        {isManual && onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-border rounded-lg text-text-primary transition-colors flex items-center gap-2"
            title="Sinh mã tự động"
          >
            <Wand2 size={16} />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-danger inline-block"></span>
          {error}
        </p>
      )}
    </div>
  );
};
