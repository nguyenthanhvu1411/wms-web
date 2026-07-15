import React, { forwardRef } from 'react';
import { Hash } from 'lucide-react';

export interface AutoCodeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: string;
  error?: string;
}

export const AutoCodeInput = forwardRef<HTMLInputElement, AutoCodeInputProps>(({ 
  label = 'Mã (Code)', 
  prefix,
  value,
  onChange,
  error,
  ...props
}, ref) => {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label} <span className="text-danger">*</span>
      </label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Hash size={16} />
          </div>
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={onChange}
            placeholder={`Nhập ${label.toLowerCase()}`}
            {...props}
            className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-colors bg-background border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
              error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border'
            }`}
          />
          {prefix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs font-mono text-text-muted bg-white px-2 py-0.5 rounded border border-border">
                {prefix}XXXXX
              </span>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-danger inline-block"></span>
          {error}
        </p>
      )}
    </div>
  );
});

AutoCodeInput.displayName = 'AutoCodeInput';
