import React, { useRef, useEffect } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  variant?: 'error' | 'info' | 'success';
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  buttonLabel = 'OK',
  variant = 'info',
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconColors = {
    error: 'text-rose-500',
    info: 'text-blue-500',
    success: 'text-emerald-500',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative w-full max-w-sm glass-panel rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200 border-white/60 dark:border-white/10"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className={`mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-current/10 ${iconColors[variant]}`}>
          {variant === 'error' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {variant === 'info' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {variant === 'success' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
