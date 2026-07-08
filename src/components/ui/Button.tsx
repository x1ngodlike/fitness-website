import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'success'
  | 'danger'
  | 'info'
  | 'purple';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * 统一交互规范（全项目唯一来源）：
 * - focus-visible：焦点环（无障碍）
 * - active：按压缩放反馈
 * - disabled：降透明度 + 禁用指针 + 去除阴影/缩放
 */
const base =
  'inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap transition-all duration-200 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ' +
  'active:scale-[0.98] ' +
  'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:active:scale-100';

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-white shadow-accent hover:brightness-110 active:brightness-95',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--line-strong)]',
  ghost: 'text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]',
  success:
    'bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-line)] hover:brightness-110',
  danger:
    'bg-[var(--bad-soft)] text-[var(--bad)] border border-[var(--bad-line)] hover:brightness-110',
  info:
    'bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-line)] hover:brightness-110',
  purple:
    'bg-[var(--purple-soft)] text-[var(--purple)] border border-[var(--purple-line)] hover:brightness-110',
};

/** 圆角统一对齐令牌：sm→--r-sm(8px) / md·lg→--r-md(12px)。 */
const sizeClass: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-5 py-3 rounded-xl',
};

/** Shared class string so links (react-router <Link>) can reuse the exact button look. */
export function buttonClassName(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  const { variant = 'primary', size = 'md', fullWidth, className = '' } = opts;
  return [base, variantClass[variant], sizeClass[size], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonClassName({ variant, size, fullWidth, className })}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
