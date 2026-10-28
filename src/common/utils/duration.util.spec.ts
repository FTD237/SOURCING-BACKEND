import {
  monthsToSeconds,
  parseDurationToMonths,
  secondsToMonths,
} from './duration.util';

describe('duration.util', () => {
  it.each([
    ['6 mois', 6],
    ['6', 6],
    [6, 6],
    ['1 an', 12],
    ['2 ANS', 24],
    ['3 months', 3],
  ])('parse %p -> %p', (input, expected) => {
    expect(parseDurationToMonths(input)).toBe(expected);
  });

  it.each(['abc', '2.5 mois', '', '6 jours', null, {}])(
    'renvoie NaN pour %p',
    (input) => {
      expect(parseDurationToMonths(input)).toBeNaN();
    },
  );

  it('fait un aller-retour mois -> secondes -> mois', () => {
    expect(secondsToMonths(String(monthsToSeconds(6)))).toBe(6);
  });
});
