export enum GameState {
  PICK = 'PICK',      // User picks a door
  REVEAL = 'REVEAL',  // Host opens a losing door
  DECIDE = 'DECIDE',  // User chooses to switch or stay
  RESULT = 'RESULT'   // Show win/loss
}

export interface DoorData {
  id: number;
  hasPrize: boolean;
  isOpen: boolean;
  isSelected: boolean;
}

export interface GameStats {
  totalGames: number;
  stayWins: number;
  stayLosses: number;
  switchWins: number;
  switchLosses: number;
  interactiveGames: number;
  simulationGames: number;
  history: {
    step: number;
    switchWinRate: number;
    stayWinRate: number;
  }[];
}

export enum Strategy {
  STAY = 'STAY',
  SWITCH = 'SWITCH'
}

export type Language = 'ru' | 'en';
export type Theme = 'light' | 'dark';
export type Outcome = 'WIN' | 'LOSE';

export interface Settings {
  lang: Language;
  theme: Theme;
  soundEnabled: boolean;
}

/** Какая дверь только что открылась — чтобы проиграть звук ровно один раз. */
export interface SoundCue {
  doorId: number;
  nonce: number;
}

export interface SimulationProgress {
  done: number;
  total: number;
}
