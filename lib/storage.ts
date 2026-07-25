import { GameStats, Language, Settings, Theme } from '../types';
import { emptyStats } from './stats';

const STATS_KEY = 'mh-stats';
const SETTINGS_KEY = 'mh-settings';

/** localStorage может быть недоступен (приватный режим, отключённые куки). */
const readKey = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeKey = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Приложение остаётся рабочим без сохранения — просто теряем историю между сессиями.
  }
};

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

const toRate = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;

const toHistory = (value: unknown): GameStats['history'] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((point): point is Record<string, unknown> => typeof point === 'object' && point !== null)
    .map((point) => ({
      step: toCount(point.step),
      switchWinRate: toRate(point.switchWinRate),
      stayWinRate: toRate(point.stayWinRate),
    }));
};

/** Читает статистику и чистит её: битые значения не должны разъезжаться по интерфейсу как NaN. */
export const loadStats = (): GameStats => {
  const saved = readKey(STATS_KEY);
  if (!saved) return emptyStats;

  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    return {
      totalGames: toCount(parsed.totalGames),
      stayWins: toCount(parsed.stayWins),
      stayLosses: toCount(parsed.stayLosses),
      switchWins: toCount(parsed.switchWins),
      switchLosses: toCount(parsed.switchLosses),
      interactiveGames: toCount(parsed.interactiveGames),
      simulationGames: toCount(parsed.simulationGames),
      history: toHistory(parsed.history),
    };
  } catch (error) {
    console.warn('Не удалось прочитать сохранённую статистику, начинаем с нуля', error);
    return emptyStats;
  }
};

export const saveStats = (stats: GameStats) => writeKey(STATS_KEY, JSON.stringify(stats));

const systemTheme = (): Theme =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const browserLanguage = (): Language => (navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en');

/** Настройки при первом визите берутся из системы и языка браузера. */
export const loadSettings = (): Settings => {
  const fallback: Settings = { lang: browserLanguage(), theme: systemTheme(), soundEnabled: false };
  const saved = readKey(SETTINGS_KEY);
  if (!saved) return fallback;

  try {
    const parsed = JSON.parse(saved) as Partial<Settings>;
    return {
      lang: parsed.lang === 'ru' || parsed.lang === 'en' ? parsed.lang : fallback.lang,
      theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : fallback.theme,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : false,
    };
  } catch {
    return fallback;
  }
};

export const saveSettings = (settings: Settings) => writeKey(SETTINGS_KEY, JSON.stringify(settings));
