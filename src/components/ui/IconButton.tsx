import React from 'react';

type IconVariant = 'ghost' | 'secondary' | 'danger' | 'success' | 'info' | 'purple';
type IconSize = 'sm' | 'md' | 'lg';

const iconBase =
  'inline-flex items-center justify-center transition-all duration-200 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-line)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ' +
  'active:scale-[0.94] ' +
  'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

const iconVariant: Record<IconVariant, string> = {
  ghost: 'text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--line-strong)]',
  danger: 'text-[var(--bad)] hover:bg-[var(--bad-soft)]',
  success: 'text-[var(--ok)] hover:bg-[var(--ok-soft)]',
  info: 'text-[var(--info)] hover:bg-[var(--info-soft)]',
  purple: 'text-[var(--purple)] hover:bg-[var(--purple-soft)]',
};

/** 圆角统一对齐令牌：sm→--r-sm(8px) / md·lg→--r-md(12px)。 */
const iconSize: Record<IconSize, string> = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-xl',
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconVariant;
  size?: IconSize;
  /** Required for accessibility */
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', label, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={[iconBase, iconVariant[variant], iconSize[size], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
