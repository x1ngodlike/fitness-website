import React from 'react';

const fieldBase =
  'w-full bg-[var(--input-bg)] border border-[var(--line-strong)] rounded-xl text-[var(--text)] placeholder-[var(--faint)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-line)] disabled:opacity-50';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, className, wrapperClassName, ...rest }, ref) => {
    if (leftIcon) {
      return (
        <div className={['relative', wrapperClassName].filter(Boolean).join(' ')}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)] pointer-events-none">
            {leftIcon}
          </span>
          <input
            ref={ref}
            className={[fieldBase, 'pl-10 pr-4 py-3 text-sm', className].filter(Boolean).join(' ')}
            {...rest}
          />
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={[fieldBase, 'px-4 py-3 text-sm', className].filter(Boolean).join(' ')}
        {...rest}
      />
    );
  }
);
Input.displayName = 'Input';
