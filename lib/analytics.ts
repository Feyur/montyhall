const METRIKA_ID = 109058899;
const METRIKA_TAG_URL = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
const CONSENT_KEY = 'mh-metrika-consent';

export type AnalyticsConsent = 'granted' | 'denied' | null;

type YandexMetrikaFn = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

type MetrikaWindow = Window & {
  dataLayer?: unknown[];
  ym?: YandexMetrikaFn;
  __montyHallMetrikaInitialized?: boolean;
};

export const getSavedConsent = (): AnalyticsConsent => {
  try {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    return saved === 'granted' || saved === 'denied' ? saved : null;
  } catch {
    return null;
  }
};

export const saveConsent = (consent: Exclude<AnalyticsConsent, null>) => {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Согласие — best-effort: без хранилища сайт продолжает работать.
  }
};

export const clearConsent = () => {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Игнорируем ошибки хранилища.
  }
};

export const isMetrikaLoaded = () => Boolean((window as MetrikaWindow).__montyHallMetrikaInitialized);

/** Счётчик подключается только после явного согласия пользователя. */
export const loadYandexMetrika = () => {
  const metrikaWindow = window as MetrikaWindow;
  if (metrikaWindow.__montyHallMetrikaInitialized) return;

  metrikaWindow.dataLayer = metrikaWindow.dataLayer ?? [];

  if (!metrikaWindow.ym) {
    const queuedYm: YandexMetrikaFn = (...args: unknown[]) => {
      queuedYm.a = queuedYm.a ?? [];
      queuedYm.a.push(args);
    };
    queuedYm.l = Date.now();
    metrikaWindow.ym = queuedYm;
  }

  const hasTag = Array.from(document.scripts).some((script) => script.src === METRIKA_TAG_URL);
  if (!hasTag) {
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = METRIKA_TAG_URL;
    document.head.appendChild(tag);
  }

  metrikaWindow.ym(METRIKA_ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });

  metrikaWindow.__montyHallMetrikaInitialized = true;
};
