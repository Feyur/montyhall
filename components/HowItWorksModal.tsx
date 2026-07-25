import React, { useEffect, useRef } from 'react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface HowItWorksModalProps {
  lang: Language;
  onClose: () => void;
}

const FOCUSABLE = 'button, a[href], input, [tabindex]:not([tabindex="-1"])';

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ lang, onClose }) => {
  const t = getTranslation(lang);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Esc закрывает, Tab не уводит фокус за пределы диалога
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = bodyOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        className="animate-in fade-in zoom-in-95 relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl duration-200 dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="how-it-works-title" className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t.howTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeModal}
            className="-mr-1 -mt-1 rounded-md p-1 text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-200">
          {t.howBody.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>

        <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500 dark:bg-stone-800/60 dark:text-stone-400">
          {t.keyboardHint}
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
