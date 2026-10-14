import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../components/Icons';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircleIcon, accent: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { icon: AlertTriangleIcon, accent: 'text-rose-400', bar: 'bg-rose-400' },
  info: { icon: InfoIcon, accent: 'text-sky-400', bar: 'bg-sky-400' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant, message, duration = 3500) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current.slice(-3), { id, variant, message }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message, duration) => show('success', message, duration),
      error: (message, duration) => show('error', message, duration ?? 5000),
      info: (message, duration) => show('info', message, duration),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map(({ id, variant, message }) => {
          const { icon: Icon, accent, bar } = VARIANTS[variant] ?? VARIANTS.info;
          return (
            <div
              key={id}
              role="status"
              className="glass pointer-events-auto relative flex w-full max-w-sm animate-toast-in items-start gap-3 overflow-hidden rounded-xl py-3 pr-3 pl-4 shadow-2xl shadow-black/50"
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${accent}`} />
              <p className="flex-1 text-sm font-medium text-slate-100">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
};
