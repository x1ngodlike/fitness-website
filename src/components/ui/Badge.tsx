import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'support'
  | 'oppose'
  | 'status-active'
  | 'status-pending'
  | 'status-ended';

const badgeClass: Record<BadgeVariant, string> = {
  neutral: 'bg-[var(--hover)] text-[var(--muted)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  success: 'bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-line)]',
  warning: 'bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn-line)]',
  danger: 'bg-[var(--bad-soft)] text-[var(--bad)] border border-[var(--bad-line)]',
  support:
    'bg-[var(--side-support)] text-[var(--side-support-text)] border border-[var(--side-support-line)]',
  oppose:
    'bg-[var(--side-oppose)] text-[var(--side-oppose-text)] border border-[var(--side-oppose-line)]',
  // 状态语义：与金融红涨绿跌的涨跌色分离，避免误读
  'status-active': 'bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-line)]',
  'status-pending': 'bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn-line)]',
  'status-ended': 'bg-[var(--hover)] text-[var(--muted)] border border-[var(--line-strong)]',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge = ({ variant = 'neutral', size = 'md', className, children, ...rest }: BadgeProps) => (
  <span
    className={[
      'inline-flex items-center gap-1 font-medium rounded-full border border-transparent',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      badgeClass[variant],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </span>
);
