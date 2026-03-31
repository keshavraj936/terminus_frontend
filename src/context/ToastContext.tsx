import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} className="animate-slide-in" style={{
            background: toast.type === 'error' ? '#111111' : 'var(--surface)',
            color: toast.type === 'error' ? '#ef4444' : 'var(--text-main)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            borderLeft: `4px solid ${toast.type === 'error' ? '#ef4444' : 'var(--primary)'}`,
            border: toast.type === 'error' ? '1px solid #333' : '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '0.95rem',
            pointerEvents: 'auto',
            minWidth: '280px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
             <span style={{ fontSize: '1.25rem' }}>{toast.type === 'error' ? '⚠️' : '✅'}</span>
             {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
