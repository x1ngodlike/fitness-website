import React from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否可交互（hover 时高亮边框）。默认 false。 */
  interactive?: boolean;
  /** 内边距尺度，默认 md。 */
  padding?: CardPadding;
  /** 是否添加统一阴影（深色背景下默认仅靠边框区分，可选开启）。 */
  shadow?: boolean;
}

export const Card = ({
  interactive,
  padding = 'md',
  shadow = false,
  className,
  children,
  ...rest
}: CardProps) => (
  <div
    className={[
      'bg-[var(--surface)] border border-[var(--line)] rounded-2xl',
      paddingClass[padding],
      shadow ? 'shadow-[var(--shadow-md)]' : '',
      interactive ? 'transition-all duration-300 hover:border-[var(--accent-line)]' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </div>
);
