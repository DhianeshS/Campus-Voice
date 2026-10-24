import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utilities/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, title, variant = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, title, variant, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast floating container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-[#365442] shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-4 h-4 text-[#B8755D] shrink-0 mt-0.5" />,
            info: <Info className="w-4 h-4 text-[#496B58] shrink-0 mt-0.5" />,
          };

          const borderColors = {
            success: 'border-[#A7B8A5] bg-[#FFFDF8]',
            error: 'border-[#DEAF9F] bg-[#FFFDF8]',
            info: 'border-[#E5E0D5] bg-[#FFFDF8]',
          };

          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto p-4 rounded-xl border shadow-card transition-all duration-200 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-2',
                borderColors[toast.variant || 'info']
              )}
            >
              <div className="flex items-start gap-2.5">
                {icons[toast.variant || 'info']}
                <div>
                  {toast.title && (
                    <h5 className="text-xs font-bold text-[#292F2B] leading-tight">
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs text-[#68716A] mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-md text-[#8C948E] hover:text-[#292F2B] hover:bg-[#F7F4EC] transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
