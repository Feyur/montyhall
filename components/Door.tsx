import React, { useMemo } from 'react';
import { DoorData, Language, Outcome } from '../types';
import { getTranslation } from '../translations';
import goatImg from '../assets/coat.png';
import carImg from '../assets/car.png';

interface DoorProps {
  door: DoorData;
  onClick: () => void;
  disabled: boolean;
  highlight?: boolean;
  lang: Language;
  outcome: Outcome | null;
}

const Door: React.FC<DoorProps> = ({ door, onClick, disabled, highlight, lang, outcome }) => {
  const t = getTranslation(lang);
  const doorNumber = door.id + 1;

  const goat = useMemo(() => {
    const name = t.goatNames[door.id % t.goatNames.length];
    const hobby = t.goatHobbies[(door.id * 2) % t.goatHobbies.length];
    return { name, hobby };
  }, [door.id, t]);

  const label = door.isOpen
    ? door.hasPrize
      ? t.doorWithPrize(doorNumber)
      : t.doorWithGoat(doorNumber, goat.name)
    : door.isSelected
      ? t.doorSelected(doorNumber)
      : t.doorClosed(doorNumber);

  const indicatorColor =
    outcome === 'WIN'
      ? 'bg-emerald-500 ring-emerald-200/70 dark:ring-emerald-800/70'
      : outcome === 'LOSE'
        ? 'bg-rose-500 ring-rose-200/70 dark:ring-rose-800/70'
        : 'bg-amber-400 ring-amber-200/70 dark:ring-amber-800/70';

  return (
    <div className="flex flex-col items-center">
      {/* Место под подпись зарезервировано всегда — верстка не прыгает при выборе */}
      <div className="flex h-6 items-end">
        {door.isSelected && (
          <span className="animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-700 duration-300 dark:text-stone-200 sm:text-xs">
            {t.yourChoice}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={door.isSelected}
        className={`perspective-1000 group relative mt-2 w-full rounded-xl transition-transform duration-200 ${
          disabled ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1'
        }`}
      >
        <span className="relative block w-full pt-[166%]" aria-hidden="true">
          <span
            className={`absolute inset-0 block transition-transform duration-700 transform-style-3d ${
              door.isOpen ? 'rotate-y-180' : ''
            }`}
          >
            {/* Лицевая сторона — закрытая дверь */}
            <span
              className={`backface-hidden absolute inset-0 flex items-center justify-center rounded-xl border bg-gradient-to-b shadow-md transition-colors duration-300 ${
                highlight
                  ? 'animate-pulse border-orange-400 from-orange-50 to-orange-100 ring-2 ring-orange-200 dark:border-orange-500 dark:from-orange-900/40 dark:to-orange-950/40 dark:ring-orange-900'
                  : door.isSelected
                    ? 'border-emerald-400 from-emerald-50 to-emerald-100/70 ring-2 ring-emerald-300/70 dark:border-emerald-500 dark:from-stone-700 dark:to-stone-800 dark:ring-emerald-700'
                    : 'border-stone-300 from-stone-50 to-stone-200 dark:border-stone-600 dark:from-stone-700 dark:to-stone-800'
              } ${disabled ? '' : 'group-hover:border-amber-400 dark:group-hover:border-amber-600'}`}
            >
              {/* Филёнка — дверь читается как дверь, а не как пустая карточка */}
              <span className="absolute inset-[9%] rounded-lg border border-stone-300/70 dark:border-stone-600/60" />
              <span
                className={`relative text-3xl font-light sm:text-4xl ${
                  highlight ? 'text-orange-500 dark:text-orange-300' : 'text-stone-400 dark:text-stone-400'
                }`}
              >
                {doorNumber}
              </span>
              <span className="absolute right-[14%] top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-stone-400/70 shadow-sm dark:bg-stone-500 sm:h-8 sm:w-1.5" />
            </span>

            {/* Оборот — что было за дверью */}
            <span className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-xl border border-stone-200 shadow-inner dark:border-stone-700">
              {door.hasPrize ? (
                <span className="flex h-full w-full flex-col items-center justify-center bg-emerald-50/70 p-1 text-center dark:bg-emerald-900/20">
                  <img
                    src={carImg}
                    alt=""
                    className="pointer-events-none mb-2 w-[70%] max-w-[96px] select-none drop-shadow-lg"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 sm:text-xs">
                    {t.sportCar}
                  </span>
                  <span className="mt-1 hidden px-1 text-[10px] leading-tight text-emerald-600 dark:text-emerald-500 sm:block">
                    {t.carDesc}
                  </span>
                </span>
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center bg-stone-100 p-1 text-center dark:bg-stone-800">
                  <img
                    src={goatImg}
                    alt=""
                    className="pointer-events-none mb-2 w-[55%] max-w-[80px] select-none drop-shadow-md"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 sm:text-sm">
                    {goat.name}
                  </span>
                  <span className="mt-1 hidden px-1 text-[10px] italic leading-tight text-stone-400 dark:text-stone-500 sm:block">
                    «{goat.hobby}»
                  </span>
                </span>
              )}
            </span>
          </span>
        </span>
      </button>

      {/* Тень под дверью */}
      <div className="mt-2 h-1 w-3/4 rounded-full bg-stone-900/5 blur-[2px] dark:bg-black/30" />

      {/* Индикатор итога вынесен из 3D-слоя, поэтому не исчезает при повороте */}
      <div className="flex h-6 items-center">
        {door.isSelected && (
          <span className={`block h-3 w-3 rounded-full ring-2 transition-colors duration-300 ${indicatorColor}`} />
        )}
      </div>
    </div>
  );
};

export default Door;
