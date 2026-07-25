import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface CookieBannerProps {
  lang: Language;
  onAccept: () => void;
  onDecline: () => void;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ lang, onAccept, onDecline }) => {
  const t = getTranslation(lang);

  return (
    <div
      role="region"
      aria-label={t.cookieTitle}
      className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-3 sm:px-6 sm:pb-4"
    >
      <div className="animate-in slide-in-from-bottom-4 mx-auto max-w-5xl rounded-xl border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-950/15 duration-300 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t.cookieTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
              {t.cookieText}{' '}
              <a
                className="font-medium text-stone-900 underline underline-offset-4 dark:text-stone-100"
                href="/privacy.html"
              >
                {t.privacyPolicy}
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
            <button
              type="button"
              onClick={onDecline}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              {t.rejectAnalytics}
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              {t.acceptAnalytics}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
