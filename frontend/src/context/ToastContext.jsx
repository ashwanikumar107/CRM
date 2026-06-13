import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    error:   'bg-red-500/20 border-red-500/40 text-red-300',
    info:    'bg-brand-500/20 border-brand-500/40 text-brand-300',
    warning: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl
              backdrop-blur-sm animate-fade-in ${colors[t.type]}`}>
            <span>{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
