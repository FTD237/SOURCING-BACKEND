export const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;

const MONTHS_PER_UNIT: Record<string, number> = {
  mois: 1,
  month: 1,
  months: 1,
  an: 12,
  ans: 12,
  year: 12,
  years: 12,
};

/**
 * "6 mois" | "6" | 6 | "1 an"  ->  nombre de mois.
 * Renvoie NaN si le format est invalide : la validation du DTO refusera la valeur.
 */
export function parseDurationToMonths(input: unknown): number {
  if (typeof input === 'number') return input;
  if (typeof input !== 'string') return Number.NaN;

  const match = /^(\d+)\s*([a-z]+)?$/.exec(input.trim().toLowerCase());
  if (!match) return Number.NaN;

  const factor = MONTHS_PER_UNIT[match[2] ?? 'mois'];
  return factor === undefined
    ? Number.NaN
    : Number.parseInt(match[1], 10) * factor;
}

export const monthsToSeconds = (months: number): number =>
  months * SECONDS_PER_MONTH;

export const secondsToMonths = (seconds: number | string): number =>
  Math.round(Number(seconds) / SECONDS_PER_MONTH);
