import React from 'react';

export interface TabOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
  fullWidth?: boolean;
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
  fullWidth,
}: TabsProps<T>) {
  return (
    <div
      className={[
        'inline-flex items-center gap-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-1',
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              'font-medium transition-all duration-200 ease-out rounded-lg whitespace-nowrap',
              size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2',
              fullWidth ? 'flex-1' : '',
              active
                ? 'bg-[var(--accent)] text-white shadow-[0_2px_10px_var(--accent-shadow)]'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)]',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
