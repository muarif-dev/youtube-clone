"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";

interface Toast {
  id: number;
  message: string;
}

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback<ShowToast>((message) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-enter flex max-w-sm items-center gap-2 rounded-lg border border-yt-border bg-[#282828] px-4 py-3 text-sm font-medium text-white shadow-2xl"
          >
            <CircleCheck className="h-4 w-4 shrink-0 text-[#6DCD83]" />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
