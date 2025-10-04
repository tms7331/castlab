"use client";

import { Toast } from "@/lib/hooks/use-toast";
import { CheckCircle, X, AlertCircle } from "lucide-react";

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export function ToastComponent({ toast, onRemove }: ToastProps) {
  const bgColor = toast.type === "success"
    ? "bg-green-100 border-green-200"
    : toast.type === "error"
    ? "bg-red-100 border-red-200"
    : "bg-blue-100 border-blue-200";

  const textColor = toast.type === "success"
    ? "text-green-700"
    : toast.type === "error"
    ? "text-red-700"
    : "text-blue-700";

  const Icon = toast.type === "success" ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} ${textColor} border rounded-lg p-3 shadow-lg flex items-start gap-2 min-w-[300px] max-w-md animate-in slide-in-from-top-5 duration-300`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToasterProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function Toaster({ toasts, onRemove }: ToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
