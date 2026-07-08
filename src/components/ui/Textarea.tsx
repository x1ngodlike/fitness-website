import React from 'react';

const fieldBase =
  'w-full bg-[var(--input-bg)] border border-[var(--line-strong)] rounded-xl text-[var(--text)] placeholder-[var(--faint)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-line)] disabled:opacity-50 resize-none';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={[fieldBase, 'px-4 py-3 text-sm', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
);
Textarea.displayName = 'Textarea';
