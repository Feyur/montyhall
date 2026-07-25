import { DoorData } from '../types';

export const DOOR_COUNT = 3;

const randomInt = (max: number) => Math.floor(Math.random() * max);

/** Новый раунд: приз за случайной дверью, все двери закрыты. */
export const createDoors = (): DoorData[] => {
  const prizeIndex = randomInt(DOOR_COUNT);
  return Array.from({ length: DOOR_COUNT }, (_, id) => ({
    id,
    hasPrize: id === prizeIndex,
    isOpen: false,
    isSelected: false,
  }));
};

/**
 * Ведущий знает, где приз, и открывает пустую дверь, которую игрок не выбирал.
 * Если игрок сразу угадал — выбор между двумя пустыми дверями случаен.
 */
export const pickDoorToReveal = (doors: DoorData[], selectedId: number): DoorData => {
  const candidates = doors.filter((door) => door.id !== selectedId && !door.hasPrize && !door.isOpen);
  if (candidates.length === 0) {
    throw new Error(`Нет пустой двери для показа: выбрана дверь ${selectedId}, состояние игры повреждено`);
  }
  return candidates[randomInt(candidates.length)];
};

/** Единственная закрытая дверь, на которую можно сменить выбор. */
export const findSwitchTarget = (doors: DoorData[], selectedId: number): DoorData | undefined =>
  doors.find((door) => door.id !== selectedId && !door.isOpen);

export interface SimulationBatch {
  rounds: number;
  stayWins: number;
  switchWins: number;
}

/**
 * Быстрая симуляция: каждый раунд проверяется обеими стратегиями сразу.
 * «Остаться» выигрывает ровно тогда, когда первый выбор угадал приз,
 * «сменить» — во всех остальных случаях, поэтому двери разыгрывать не нужно.
 */
export const simulateRounds = (rounds: number): SimulationBatch => {
  let stayWins = 0;
  for (let i = 0; i < rounds; i++) {
    if (randomInt(DOOR_COUNT) === randomInt(DOOR_COUNT)) stayWins++;
  }
  return { rounds, stayWins, switchWins: rounds - stayWins };
};
