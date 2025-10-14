import React from 'react';
import { useToast } from '../../hooks/useToast';

export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => hideToast(toast.id)}
        >
          <div className="toast-content">
            <div className="toast-icon">
              {toast.type === 'error' && '❌'}
              {toast.type === 'success' && '✅'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                hideToast(toast.id);
              }}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
