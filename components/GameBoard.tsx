import React from 'react';
import Door from './Door';
import { DoorData, GameState, Language, Outcome, SimulationProgress, Strategy } from '../types';
import { getTranslation } from '../translations';

interface GameBoardProps {
  doors: DoorData[];
  gameState: GameState;
  message: string;
  outcome: Outcome | null;
  lang: Language;
  isSimulating: boolean;
  simProgress: SimulationProgress | null;
  onPick: (doorId: number) => void;
  onDecide: (strategy: Strategy) => void;
  onRestart: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  doors,
  gameState,
  message,
  outcome,
  lang,
  isSimulating,
  simProgress,
  onPick,
  onDecide,
  onRestart,
}) => {
  const t = getTranslation(lang);
  const progressPercent = simProgress && simProgress.total > 0
    ? Math.round((simProgress.done / simProgress.total) * 100)
    : 0;

  return (
    <div className="relative flex w-full flex-col items-center overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-stone-800 dark:bg-stone-900 sm:p-8 md:p-10">
      {isSimulating && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 px-6 dark:bg-stone-950/90">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800 dark:border-stone-800 dark:border-t-stone-200" />
          <span className="font-medium text-stone-500 dark:text-stone-400">{t.processing}</span>
          {simProgress && (
            <div className="mt-3 flex w-full max-w-xs flex-col items-center gap-2">
              <span className="text-xs font-medium tabular-nums text-stone-400 dark:text-stone-500">
                {simProgress.done}/{simProgress.total}
              </span>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={simProgress.total}
                aria-valuenow={simProgress.done}
                aria-label={t.processing}
                className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
              >
                <div
                  className="h-full rounded-full bg-stone-800 transition-all duration-150 dark:bg-stone-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Реплика ведущего */}
      <div className="mb-8 flex w-full max-w-2xl flex-col items-center gap-3 sm:mb-10">
        <p className="text-center text-xs font-semibold text-amber-700 dark:text-amber-300 sm:text-sm">{t.hostNote}</p>
        <div className="flex w-full items-start gap-3">
          <div className="flex shrink-0 flex-col items-center">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-xl shadow-lg dark:from-orange-600 dark:to-amber-500 sm:h-14 sm:w-14 sm:text-2xl"
              aria-hidden="true"
            >
              🎤
            </div>
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
              {t.hostLabel}
            </span>
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm dark:border-stone-700 dark:bg-stone-800/80">
              <p
                role="status"
                aria-live="polite"
                className={`text-base font-medium transition-colors duration-300 sm:text-lg ${
                  outcome === 'WIN'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : outcome === 'LOSE'
                      ? 'text-stone-500 dark:text-stone-400'
                      : 'text-stone-800 dark:text-stone-200'
                }`}
              >
                {message}
              </p>
            </div>
            <div className="absolute -left-1.5 top-6 h-3 w-3 rotate-45 border-b border-l border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/80" />
          </div>
        </div>
      </div>

      {/* Двери */}
      <div className="grid w-full max-w-[24rem] grid-cols-3 gap-3 sm:max-w-xl sm:gap-6 lg:max-w-2xl">
        {doors.map((door) => (
          <Door
            key={door.id}
            door={door}
            onClick={() => onPick(door.id)}
            disabled={gameState !== GameState.PICK || isSimulating}
            highlight={gameState === GameState.DECIDE && !door.isOpen && !door.isSelected}
            lang={lang}
            outcome={outcome}
          />
        ))}
      </div>

      {/* Управление */}
      <div className="mt-6 flex min-h-[6rem] w-full flex-col items-center justify-center gap-2 sm:mt-8">
        {(gameState === GameState.PICK || gameState === GameState.REVEAL) && (
          <p className="text-xs text-stone-400 dark:text-stone-500">{t.keyboardHint}</p>
        )}

        {gameState === GameState.DECIDE && (
          <div className="animate-in slide-in-from-bottom-4 flex w-full flex-col items-center gap-3 duration-500">
            <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => onDecide(Strategy.STAY)}
                className="rounded-full bg-stone-100 px-8 py-3 font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                {t.stay}
              </button>
              <button
                type="button"
                onClick={() => onDecide(Strategy.SWITCH)}
                className="rounded-full bg-stone-900 px-8 py-3 font-medium text-white shadow-lg shadow-stone-900/20 transition-colors hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:shadow-stone-100/10 dark:hover:bg-stone-200"
              >
                {t.switch}
              </button>
            </div>
            <p className="max-w-md text-center text-xs text-stone-400 dark:text-stone-500">{t.switchHintText}</p>
          </div>
        )}

        {gameState === GameState.RESULT && (
          <button
            type="button"
            onClick={onRestart}
            className="animate-in fade-in rounded-full bg-emerald-100 px-8 py-3 font-medium text-emerald-800 transition-colors duration-300 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-900/70"
          >
            {t.restart}
          </button>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
