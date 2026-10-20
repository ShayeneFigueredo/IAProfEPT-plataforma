import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', title = null) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    let defaultTitle = 'Notificação IAprofEPT';
    if (type === 'success') defaultTitle = 'Sucesso';
    if (type === 'error') defaultTitle = 'Atenção';
    if (type === 'warning') defaultTitle = 'Aviso Pedagógico';
    if (type === 'info') defaultTitle = 'Informação';

    const newToast = {
      id,
      message: String(message),
      type,
      title: title || defaultTitle,
      createdAt: Date.now()
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Mantém no máximo 5 toasts simultâneos

    setTimeout(() => {
      removeToast(id);
    }, 4500);

    return id;
  }, [removeToast]);

  // Intercepta e estiliza globalmente qualquer chamada a window.alert() no navegador
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      addToast(msg, 'success', 'IAprofEPT Notificação');
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [addToast]);

  const value = {
    toast: {
      success: (msg, title) => addToast(msg, 'success', title),
      error: (msg, title) => addToast(msg, 'error', title),
      info: (msg, title) => addToast(msg, 'info', title),
      warning: (msg, title) => addToast(msg, 'warning', title),
    },
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => {
          let IconComponent = CheckCircle2;
          let iconColor = '#10B981';

          if (t.type === 'error') {
            IconComponent = AlertCircle;
            iconColor = '#DC2626';
          } else if (t.type === 'warning') {
            IconComponent = AlertTriangle;
            iconColor = '#D97706';
          } else if (t.type === 'info') {
            IconComponent = Info;
            iconColor = '#064E3B';
          }

          return (
            <div key={t.id} className={`toast-item toast-${t.type}`} role="alert">
              <div className="toast-icon">
                <IconComponent size={22} color={iconColor} />
              </div>
              <div className="toast-content">
                <div className="toast-title">{t.title}</div>
                <div className="toast-message">{t.message}</div>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Fechar notificação"
              >
                <X size={16} />
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
    // Fallback gracioso caso chamado fora do Provider
    return {
      success: (m) => window.alert(m),
      error: (m) => window.alert(m),
      info: (m) => window.alert(m),
      warning: (m) => window.alert(m),
    };
  }
  return context.toast;
}

export default ToastProvider;
