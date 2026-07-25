import { GameStats, Strategy } from '../types';
import { SimulationBatch } from './game';

/** Сколько точек храним в графике динамики. */
const HISTORY_LIMIT = 200;

export const emptyStats: GameStats = {
  totalGames: 0,
  stayWins: 0,
  stayLosses: 0,
  switchWins: 0,
  switchLosses: 0,
  interactiveGames: 0,
  simulationGames: 0,
  history: [],
};

export const winRate = (wins: number, total: number) => (total > 0 ? Math.round((wins / total) * 100) : 0);

export const switchAttempts = (stats: GameStats) => stats.switchWins + stats.switchLosses;
export const stayAttempts = (stats: GameStats) => stats.stayWins + stats.stayLosses;

/** Добавляет текущий срез процентов в историю графика. */
export const withHistoryPoint = (stats: GameStats): GameStats => {
  const point = {
    step: stats.totalGames,
    switchWinRate: winRate(stats.switchWins, switchAttempts(stats)),
    stayWinRate: winRate(stats.stayWins, stayAttempts(stats)),
  };
  return { ...stats, history: [...stats.history.slice(-(HISTORY_LIMIT - 1)), point] };
};

/** Один сыгранный вручную раунд: одна стратегия — одна попытка. */
export const addInteractiveRound = (stats: GameStats, strategy: Strategy, isWin: boolean): GameStats =>
  withHistoryPoint({
    ...stats,
    totalGames: stats.totalGames + 1,
    interactiveGames: stats.interactiveGames + 1,
    stayWins: stats.stayWins + (strategy === Strategy.STAY && isWin ? 1 : 0),
    stayLosses: stats.stayLosses + (strategy === Strategy.STAY && !isWin ? 1 : 0),
    switchWins: stats.switchWins + (strategy === Strategy.SWITCH && isWin ? 1 : 0),
    switchLosses: stats.switchLosses + (strategy === Strategy.SWITCH && !isWin ? 1 : 0),
  });

/** Пачка симуляции: каждый раунд даёт по одной попытке обеим стратегиям. */
export const addSimulationBatch = (stats: GameStats, batch: SimulationBatch): GameStats =>
  withHistoryPoint({
    ...stats,
    totalGames: stats.totalGames + batch.rounds,
    simulationGames: stats.simulationGames + batch.rounds,
    stayWins: stats.stayWins + batch.stayWins,
    stayLosses: stats.stayLosses + (batch.rounds - batch.stayWins),
    switchWins: stats.switchWins + batch.switchWins,
    switchLosses: stats.switchLosses + (batch.rounds - batch.switchWins),
  });
