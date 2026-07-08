import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}
const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

interface ConfirmOpts {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}
interface ConfirmCtx {
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}
const ConfirmContext = createContext<ConfirmCtx>({ confirm: () => Promise.resolve(false) });
export const useConfirm = () => useContext(ConfirmContext);

const toastStyle: Record<ToastType, string> = {
  success: 'bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-line)]',
  error: 'bg-[var(--bad-soft)] text-[var(--bad)] border border-[var(--bad-line)]',
  info: 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)]',
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOpts;
    resolve: (v: boolean) => void;
  } | null>(null);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ opts, resolve })),
    []
  );

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ConfirmContext.Provider value={{ confirm }}>
        {children}
        {createPortal(
          <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[var(--z-toast)] flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={[
                  'pointer-events-auto px-4 py-3 rounded-xl shadow-lg backdrop-blur animate-fade-in-up text-sm font-medium',
                  toastStyle[t.type],
                ].join(' ')}
              >
                {t.message}
              </div>
            ))}
          </div>,
          document.body
        )}
        {confirmState &&
          createPortal(
            <div
              className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--bg-90)] backdrop-blur-sm p-4 animate-fade-in-up"
              onClick={() => closeConfirm(false)}
            >
              <div
                className="w-full max-w-sm bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-bold text-[var(--text)] mb-2">
                  {confirmState.opts.title}
                </h3>
                {confirmState.opts.message && (
                  <p className="text-[var(--muted)] text-sm mb-5">{confirmState.opts.message}</p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => closeConfirm(false)}>
                    {confirmState.opts.cancelText || '取消'}
                  </Button>
                  <Button
                    variant={confirmState.opts.danger ? 'danger' : 'primary'}
                    fullWidth
                    onClick={() => closeConfirm(true)}
                  >
                    {confirmState.opts.confirmText || '确认'}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
