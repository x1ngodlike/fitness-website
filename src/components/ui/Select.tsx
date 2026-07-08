import React from 'react';

const fieldBase =
  'w-full bg-[var(--input-bg)] border border-[var(--line-strong)] rounded-xl text-[var(--text)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-line)] disabled:opacity-50 px-4 py-3 text-sm appearance-none cursor-pointer';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <div className="relative">
      <select ref={ref} className={[fieldBase, className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--faint)] pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
);
Select.displayName = 'Select';
