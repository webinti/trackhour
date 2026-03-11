"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center"
      >
        {/* Le contenu est injecté via children via une variante de pattern */}
        <slot />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl max-w-sm p-6 z-50"
            >
              <h2 className="text-lg font-bold text-[var(--brand-dark)] mb-2">
                {title}
              </h2>
              <p className="text-sm text-gray-600 mb-6">{description}</p>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  variant={isDangerous ? "destructive" : "default"}
                  loading={isLoading}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook pour utiliser plus simplement
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmDialogProps, "onConfirm"> & { onConfirm?: () => void | Promise<void> } | null>(null);

  const confirm = (options: ConfirmDialogProps) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        onConfirm: async () => {
          await options.onConfirm();
          resolve(true);
          setIsOpen(false);
        },
      });
      setIsOpen(true);
    });
  };

  return { confirm, isOpen, config };
}
