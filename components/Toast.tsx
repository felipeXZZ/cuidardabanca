'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const isSuccess = toast.type === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, x: 64, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.9 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border text-sm font-medium max-w-[320px] pointer-events-auto shadow-lg ${
        isSuccess
          ? 'bg-white dark:bg-[#1E293B] border-[#BBF7D0] dark:border-[#166534] text-[#14532D] dark:text-[#4ADE80]'
          : 'bg-white dark:bg-[#1E293B] border-[#FECACA] dark:border-[#991B1B] text-[#7F1D1D] dark:text-[#FCA5A5]'
      }`}
    >
      {isSuccess
        ? <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
        : <XCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
      }
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#94A3B8] hover:text-[#64748B] dark:hover:text-[#CBD5E1] transition-colors ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
