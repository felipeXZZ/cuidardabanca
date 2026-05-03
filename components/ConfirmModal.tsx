'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open, title, description,
  confirmLabel = 'Confirmar',
  confirmDanger = false,
  onConfirm, onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-modal border border-[#E2E8F0] dark:border-[#334155] p-6 w-full max-w-md"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  confirmDanger ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30' : 'bg-[#FFFBEB] dark:bg-[#78350F]/30'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${confirmDanger ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-1">{title}</h3>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{description}</p>
                </div>
                <button
                  onClick={onCancel}
                  className="text-[#94A3B8] hover:text-[#64748B] dark:hover:text-[#CBD5E1] transition-colors flex-shrink-0 mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] rounded-lg transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#334155]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { onConfirm(); onCancel(); }}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${
                    confirmDanger
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : 'bg-[#D97706] hover:bg-[#B45309]'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
