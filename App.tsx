import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameBoard from './components/GameBoard';
import StatsBoard from './components/StatsBoard';
import HowItWorksModal from './components/HowItWorksModal';
import CookieBanner from './components/CookieBanner';
import { DoorData, GameState, Outcome, SimulationProgress, Strategy } from './types';
import { getTranslation } from './translations';
import { createDoors, findSwitchTarget, pickDoorToReveal, simulateRounds } from './lib/game';
import { addInteractiveRound, addSimulationBatch, emptyStats } from './lib/stats';
import { loadSettings, loadStats, saveSettings, saveStats } from './lib/storage';
import { playOutcomeSound } from './lib/sounds';
import { IS_OFFLINE_BUILD } from './lib/env';
import {
  AnalyticsConsent,
  clearConsent,
  getSavedConsent,
  isMetrikaLoaded,
  loadYandexMetrika,
  saveConsent,
} from './lib/analytics';

/** Пауза перед тем, как ведущий откроет пустую дверь. */
const HOST_DELAY_MS = 650;
/** Шаг симуляции: ~24 видимых обновления статистики, около двух секунд. */
const SIM_STEPS = 24;
const SIM_STEP_MS = 80;

const App: React.FC = () => {
  const initialSettings = useMemo(loadSettings, []);
  const [lang, setLang] = useState(initialSettings.lang);
  const [theme, setTheme] = useState(initialSettings.theme);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings.soundEnabled);

  const [doors, setDoors] = useState<DoorData[]>(createDoors);
  const [gameState, setGameState] = useState<GameState>(GameState.PICK);
  const [revealedDoorId, setRevealedDoorId] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const [stats, setStats] = useState(loadStats);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState<SimulationProgress | null>(null);

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  // В офлайн-файле аналитики нет вовсе — спрашивать согласие не о чем
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsent>(() =>
    IS_OFFLINE_BUILD ? 'denied' : getSavedConsent()
  );

  const revealTimeoutRef = useRef<number | null>(null);
  const simTimeoutRef = useRef<number | null>(null);
  const simCancelledRef = useRef(false);

  const t = getTranslation(lang);

  // --- Настройки и оформление ---

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    saveSettings({ lang, theme, soundEnabled });
  }, [lang, theme, soundEnabled]);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  useEffect(() => {
    if (analyticsConsent === 'granted') loadYandexMetrika();
  }, [analyticsConsent]);

  // Таймеры не должны пережить размонтирование компонента
  useEffect(
    () => () => {
      if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
      if (simTimeoutRef.current) window.clearTimeout(simTimeoutRef.current);
      simCancelledRef.current = true;
    },
    []
  );

  // --- Раунд ---

  const startRound = useCallback(() => {
    if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
    setDoors(createDoors());
    setGameState(GameState.PICK);
    setRevealedDoorId(null);
    setOutcome(null);
  }, []);

  const pickDoor = useCallback(
    (doorId: number) => {
      if (gameState !== GameState.PICK || isSimulating) return;

      const picked = doors.map((door) => ({ ...door, isSelected: door.id === doorId }));
      setDoors(picked);
      setGameState(GameState.REVEAL);

      revealTimeoutRef.current = window.setTimeout(() => {
        const revealed = pickDoorToReveal(picked, doorId);
        setDoors(picked.map((door) => (door.id === revealed.id ? { ...door, isOpen: true } : door)));
        setRevealedDoorId(revealed.id);
        setGameState(GameState.DECIDE);
      }, HOST_DELAY_MS);
    },
    [doors, gameState, isSimulating]
  );

  const decide = useCallback(
    (strategy: Strategy) => {
      if (gameState !== GameState.DECIDE) return;

      const selected = doors.find((door) => door.isSelected);
      if (!selected) return;

      const finalDoor = strategy === Strategy.SWITCH ? findSwitchTarget(doors, selected.id) ?? selected : selected;
      const isWin = finalDoor.hasPrize;

      setDoors(doors.map((door) => ({ ...door, isOpen: true, isSelected: door.id === finalDoor.id })));
      setOutcome(isWin ? 'WIN' : 'LOSE');
      setGameState(GameState.RESULT);
      setStats((prev) => addInteractiveRound(prev, strategy, isWin));

      if (soundEnabled) playOutcomeSound(isWin);
    },
    [doors, gameState, soundEnabled]
  );

  /** Текст ведущего вычисляется из состояния, поэтому смена языка обновляет и его. */
  const message = useMemo(() => {
    switch (gameState) {
      case GameState.REVEAL:
        return t.hostThinking;
      case GameState.DECIDE: {
        if (revealedDoorId === null) return t.pickMsg;
        const selected = doors.find((door) => door.isSelected);
        const target = selected ? findSwitchTarget(doors, selected.id) : undefined;
        const hint = target ? ` ${t.switchHint(target.id + 1)}` : '';
        return `${t.revealMsg(revealedDoorId + 1)}${hint}`;
      }
      case GameState.RESULT:
        return outcome === 'WIN' ? t.winMsg : t.loseMsg;
      default:
        return t.pickMsg;
    }
  }, [doors, gameState, outcome, revealedDoorId, t]);

  // --- Симуляция ---

  const stopSimulation = useCallback(() => {
    simCancelledRef.current = true;
    if (simTimeoutRef.current) window.clearTimeout(simTimeoutRef.current);
    setIsSimulating(false);
    setSimProgress(null);
    startRound();
  }, [startRound]);

  const runSimulation = useCallback(
    (rounds: number) => {
      if (isSimulating) return;

      simCancelledRef.current = false;
      setIsSimulating(true);
      setSimProgress({ done: 0, total: rounds });

      const batchSize = Math.max(5, Math.ceil(rounds / SIM_STEPS));
      let remaining = rounds;

      const step = () => {
        if (simCancelledRef.current) return;

        const size = Math.min(batchSize, remaining);
        setStats((prev) => addSimulationBatch(prev, simulateRounds(size)));
        remaining -= size;
        setSimProgress({ done: rounds - remaining, total: rounds });

        if (remaining > 0) {
          simTimeoutRef.current = window.setTimeout(step, SIM_STEP_MS);
        } else {
          setIsSimulating(false);
          setSimProgress(null);
          startRound();
        }
      };

      simTimeoutRef.current = window.setTimeout(step, SIM_STEP_MS);
    },
    [isSimulating, startRound]
  );

  const resetStats = useCallback(() => setStats(emptyStats), []);

  // --- Клавиатура: 1/2/3 выбирают дверь, Enter начинает новый раунд ---

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSimulating || showHowItWorks || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target && ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (gameState === GameState.PICK && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault();
        pickDoor(Number(event.key) - 1);
        return;
      }

      if (gameState === GameState.RESULT && event.key === 'Enter') {
        event.preventDefault();
        startRound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isSimulating, pickDoor, showHowItWorks, startRound]);

  // --- Аналитика ---

  const handleConsent = useCallback((consent: Exclude<AnalyticsConsent, null>) => {
    saveConsent(consent);
    setAnalyticsConsent(consent);
    // Метрику нельзя выгрузить из страницы — при отказе перезагружаем её без счётчика
    if (consent === 'denied' && isMetrikaLoaded()) window.location.reload();
  }, []);

  const reopenCookieSettings = useCallback(() => {
    clearConsent();
    setAnalyticsConsent(null);
  }, []);

  const toggleGroupButton = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
      active
        ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-white'
        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
    }`;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8 font-sans transition-colors duration-300 sm:px-6 sm:py-12">
      {showHowItWorks && <HowItWorksModal lang={lang} onClose={() => setShowHowItWorks(false)} />}

      <header className="mb-8 w-full max-w-6xl border-b border-stone-200 pb-6 dark:border-stone-800 sm:mb-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-1 self-start rounded-lg border border-stone-200 bg-stone-100 p-1 dark:border-stone-800 dark:bg-stone-900 sm:self-auto">
            <div className="flex gap-1" role="group" aria-label={t.langAria}>
              <button type="button" onClick={() => setLang('ru')} aria-pressed={lang === 'ru'} className={toggleGroupButton(lang === 'ru')}>
                RU
              </button>
              <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={toggleGroupButton(lang === 'en')}>
                EN
              </button>
            </div>

            <span className="mx-1 h-4 w-px bg-stone-300 dark:bg-stone-700" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? t.themeToDark : t.themeToLight}
              title={theme === 'light' ? t.themeToDark : t.themeToLight}
              className="rounded-md p-1.5 text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>

            <span className="mx-1 h-4 w-px bg-stone-300 dark:bg-stone-700" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? t.soundOn : t.soundOff}
              title={soundEnabled ? t.soundOn : t.soundOff}
              className={`rounded-md p-1.5 transition-all ${
                soundEnabled
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-stone-700 dark:text-emerald-300'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {soundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="mb-8 w-full max-w-6xl">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/40 dark:via-stone-900 dark:to-emerald-950/40 sm:p-6">
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-stone-700 dark:text-stone-200">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm dark:bg-stone-800/80"
                aria-hidden="true"
              >
                🐐
              </span>
              <p>{t.introStory}</p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm transition-colors hover:bg-white dark:border-amber-900 dark:bg-stone-800/80 dark:text-amber-200 dark:hover:bg-stone-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                {t.howItWorks}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7 xl:col-span-8">
          <GameBoard
            doors={doors}
            gameState={gameState}
            message={message}
            outcome={outcome}
            lang={lang}
            isSimulating={isSimulating}
            simProgress={simProgress}
            onPick={pickDoor}
            onDecide={decide}
            onRestart={startRound}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
          <StatsBoard
            stats={stats}
            lang={lang}
            theme={theme}
            onReset={resetStats}
            onSimulate={runSimulation}
            onCancelSim={stopSimulation}
            isSimulating={isSimulating}
          />

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm leading-relaxed text-stone-600 transition-colors duration-300 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 sm:p-6">
            <h2 className="mb-3 font-semibold text-stone-800 dark:text-stone-200">{t.staticInfoTitle}</h2>
            <p>{t.staticInfoP1}</p>
            <p className="mt-2">{t.staticInfoP2}</p>
          </div>
        </div>
      </main>

      <footer className="mt-12 w-full max-w-6xl border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-3xl leading-relaxed">
            © {new Date().getFullYear()} Monty Hall Paradox Simulator. {t.legalDisclaimer}
          </p>
          {!IS_OFFLINE_BUILD && (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a
                className="text-stone-600 underline underline-offset-4 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                href="/privacy.html"
              >
                {t.privacyPolicy}
              </a>
              <button
                type="button"
                onClick={reopenCookieSettings}
                className="text-left text-stone-600 underline underline-offset-4 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                {t.cookieSettings}
              </button>
            </div>
          )}
        </div>
      </footer>

      {analyticsConsent === null && (
        <CookieBanner lang={lang} onAccept={() => handleConsent('granted')} onDecline={() => handleConsent('denied')} />
      )}
    </div>
  );
};

export default App;
