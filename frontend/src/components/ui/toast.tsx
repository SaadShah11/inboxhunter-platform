'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Helper functions for quick toasts
export function toast(options: Omit<Toast, 'id'>) {
  // This will be overwritten by the provider
  console.warn('Toast provider not mounted');
  return '';
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  loading: <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
  loading: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800',
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'animate-in slide-in-from-right-full duration-300',
        bgColors[t.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{t.title}</p>
        {t.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t.description}</p>
        )}
        {t.action && (
          <button
            onClick={t.action.onClick}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {t.action.label}
          </button>
        )}
      </div>
      {t.type !== 'loading' && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { ...options, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss (except loading toasts)
    if (options.type !== 'loading') {
      const duration = options.duration ?? 5000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, dismiss, dismissAll }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

