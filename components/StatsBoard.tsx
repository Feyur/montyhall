import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, LineChart, Line, CartesianGrid } from 'recharts';
import { GameStats, Language, Theme } from '../types';
import { getTranslation } from '../translations';
import { stayAttempts, switchAttempts, winRate } from '../lib/stats';

interface StatsBoardProps {
  stats: GameStats;
  lang: Language;
  theme: Theme;
  onReset: () => void;
  onSimulate: (rounds: number) => void;
  onCancelSim: () => void;
  isSimulating: boolean;
}

const SWITCH_COLOR = '#10b981';
const STAY_COLOR = '#f97316';

const StatsBoard: React.FC<StatsBoardProps> = ({ stats, lang, theme, onReset, onSimulate, onCancelSim, isSimulating }) => {
  const t = getTranslation(lang);
  const isDark = theme === 'dark';

  const switchTotal = switchAttempts(stats);
  const stayTotal = stayAttempts(stats);
  const switchWinRate = winRate(stats.switchWins, switchTotal);
  const stayWinRate = winRate(stats.stayWins, stayTotal);
  const hasData = stats.totalGames > 0;

  const barData = [
    { name: t.switchStrategy, winRate: switchWinRate },
    { name: t.stayStrategy, winRate: stayWinRate },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? '#1c1917' : '#fff',
    borderColor: isDark ? '#292524' : '#e7e5e4',
    color: isDark ? '#e7e5e4' : '#292524',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
  };

  const secondaryButton =
    'rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700';

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{t.statsTitle}</h2>
          <button
            type="button"
            onClick={onReset}
            disabled={isSimulating || !hasData}
            className="shrink-0 text-xs font-medium text-stone-500 underline underline-offset-4 transition-colors hover:text-stone-800 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 dark:text-stone-400 dark:hover:text-stone-200"
          >
            {t.resetStats}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onSimulate(100)} disabled={isSimulating} className={secondaryButton}>
            {t.sim100}
          </button>
          <button type="button" onClick={() => onSimulate(1000)} disabled={isSimulating} className={secondaryButton}>
            {t.sim1000}
          </button>
          {isSimulating && (
            <button
              type="button"
              onClick={onCancelSim}
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/60"
            >
              {t.cancelSim}
            </button>
          )}
        </div>
        <p className="text-xs leading-relaxed text-stone-400 dark:text-stone-500">{t.simNote}</p>
      </div>

      {!hasData ? (
        <p className="rounded-xl border-2 border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-800 dark:text-stone-500">
          {t.statsEmpty}
        </p>
      ) : (
        <>
          <div className="mb-4 h-28 w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: isDark ? '#a8a29e' : '#78716c' }}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={false}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === t.switchStrategy ? SWITCH_COLOR : STAY_COLOR} />
                  ))}
                  <LabelList
                    dataKey="winRate"
                    position="right"
                    formatter={(value) => `${value}%`}
                    style={{ fontSize: 12, fontWeight: 600, fill: isDark ? '#e7e5e4' : '#44403c' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-stone-400 dark:text-stone-500">{t.winsSwitch}</span>
              <span className="text-lg font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                {switchWinRate}%
              </span>
              <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
                {t.absWins}: {stats.switchWins}/{switchTotal}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">{t.theory}: ~66.6%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-stone-400 dark:text-stone-500">{t.winsStay}</span>
              <span className="text-lg font-medium tabular-nums text-orange-500 dark:text-orange-400">
                {stayWinRate}%
              </span>
              <span className="text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
                {t.absWins}: {stats.stayWins}/{stayTotal}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">{t.theory}: ~33.3%</span>
            </div>
          </div>

          <dl className="mb-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
            {[
              { label: t.roundsLabel, value: stats.totalGames },
              { label: t.interactiveLabel, value: stats.interactiveGames },
              { label: t.simulationLabel, value: stats.simulationGames },
            ].map((tile) => (
              <div
                key={tile.label}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-3 dark:border-stone-800 dark:bg-stone-800/60"
              >
                <dt className="text-[11px] leading-tight text-stone-500 dark:text-stone-400">{tile.label}</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums text-stone-700 dark:text-stone-200">
                  {tile.value}
                </dd>
              </div>
            ))}
          </dl>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                {t.dynamicsTitle}
              </h3>
              <div className="flex gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SWITCH_COLOR }} />
                  {t.switchStrategy}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAY_COLOR }} />
                  {t.stayStrategy}
                </span>
              </div>
            </div>
            <div className="h-28 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.history} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={isDark ? '#292524' : '#e7e5e4'} />
                  <XAxis dataKey="step" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => `${t.roundsLabel}: ${label}`}
                    formatter={(value, name) => [`${value}%`, name === 'switchWinRate' ? t.switchStrategy : t.stayStrategy]}
                  />
                  <Line type="monotone" dataKey="switchWinRate" stroke={SWITCH_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="stayWinRate" stroke={STAY_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default StatsBoard;
