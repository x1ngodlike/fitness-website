import React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const Checkbox = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
  children,
}: CheckboxProps) => {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div
        className={`relative w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'bg-[var(--surface-2)] border-[var(--line)]'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleChange}
      >
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {(label || children) && <span className="text-sm text-[var(--text)]">{label || children}</span>}
    </label>
  );
};