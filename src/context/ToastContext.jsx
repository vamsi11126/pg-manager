import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3200;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback((message, type = 'info') => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    }, [removeToast]);

    const value = useMemo(() => ({
        showToast: pushToast,
        success: (message) => pushToast(message, 'success'),
        error: (message) => pushToast(message, 'error'),
        info: (message) => pushToast(message, 'info')
    }), [pushToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-stack" aria-live="polite" aria-atomic="true">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                        <button
                            type="button"
                            className="toast-close"
                            aria-label="Close notification"
                            onClick={() => removeToast(toast.id)}
                        >
                            x
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
