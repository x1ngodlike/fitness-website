import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlay?: boolean;
  /** Hide the title bar + default close button (e.g. full-screen image preview). */
  hideHeader?: boolean;
  /** Extra content rendered in the header, left of the close button. */
  headerRight?: React.ReactNode;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  hideHeader = false,
  headerRight,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center bg-[var(--bg-90)] backdrop-blur-sm p-0 sm:p-6 animate-fade-in-up"
      onClick={() => closeOnOverlay && onClose()}
    >
      <div
        className={[
          'w-full bg-[var(--surface)] border border-[var(--line)] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto scroll-slim',
          sizeClass[size],
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 pb-3 pt-5 sm:-mx-6 sm:px-6 sm:pt-6">
            <h3 className="font-display text-lg font-bold text-[var(--text)] truncate">{title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerRight}
              <IconButton label="关闭" size="sm" onClick={onClose}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </IconButton>
            </div>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-5 flex gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
