import carSoundUrl from '../assets/car.wav';
import goatSoundUrl from '../assets/goat.wav';

const createAudio = (src: string, volume: number) => {
  const audio = new Audio(src);
  audio.volume = volume;
  return audio;
};

let carAudio: HTMLAudioElement | undefined;
let goatAudio: HTMLAudioElement | undefined;

/**
 * Звук итога раунда. Файлы создаются лениво — до первого включённого звука
 * ничего не грузится. Браузер может отклонить play() без жеста пользователя,
 * это штатная ситуация, а не ошибка приложения.
 */
export const playOutcomeSound = (isWin: boolean) => {
  const audio = isWin
    ? (carAudio ??= createAudio(carSoundUrl, 0.9))
    : (goatAudio ??= createAudio(goatSoundUrl, 0.85));

  audio.currentTime = 0;
  void audio.play().catch(() => {});
};
