import { Holiday } from '../types';

/**
 * Converts a Date object to a 'YYYY-MM-DD' string based on local date parts.
 * This avoids timezone conversion issues associated with `toISOString()`.
 */
export const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Vérifie si une date donnée est comprise dans une période de vacances scolaires.
 */
export const isDateInHoliday = (date: Date | string, holidays?: Holiday[]): boolean => {
  if (!holidays || holidays.length === 0) return false;
  const d = typeof date === 'string' ? new Date(date.replace(/-/g, '/')) : new Date(date);
  d.setHours(0, 0, 0, 0);
  const time = d.getTime();

  return holidays.some(h => {
    if (!h.startDate || !h.endDate) return false;
    const s = new Date(h.startDate.replace(/-/g, '/'));
    s.setHours(0, 0, 0, 0);
    const e = new Date(h.endDate.replace(/-/g, '/'));
    e.setHours(0, 0, 0, 0);
    return time >= s.getTime() && time <= e.getTime();
  });
};

/**
 * Calcule l'ensemble des dates (format YYYY-MM-DD) correspondant au tout premier jour
 * ouvert à la réservation suivant immédiatement la fin de chaque période de vacances scolaires.
 * Par exemple, si les vacances se terminent le dimanche 01/11/2026 et que les jours autorisés
 * sont les mardis (2) et jeudis (4), le premier jour ouvert est le mardi 03/11/2026.
 */
export const getPostHolidayFirstDayStrings = (
  holidays?: Holiday[],
  allowedDays: number[] = [2, 4]
): Set<string> => {
  const dates = new Set<string>();
  if (!holidays || holidays.length === 0) return dates;

  const validAllowedDays = allowedDays && allowedDays.length > 0 ? allowedDays : [2, 4];

  holidays.forEach(h => {
    if (!h.endDate) return;
    const end = new Date(h.endDate.replace(/-/g, '/'));
    end.setHours(0, 0, 0, 0);
    if (isNaN(end.getTime())) return;

    // On part du jour suivant la fin des vacances
    const cur = new Date(end);
    cur.setDate(cur.getDate() + 1);

    // On recherche le premier jour qui n'est dans aucune période de vacances et qui fait partie des jours autorisés
    for (let i = 0; i < 60; i++) {
      if (!isDateInHoliday(cur, holidays)) {
        if (validAllowedDays.includes(cur.getDay())) {
          dates.add(toYYYYMMDD(cur));
          break;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
  });

  return dates;
};

/**
 * Vérifie si un créneau (date et heure) correspond au premier créneau de 9h
 * après une période de vacances scolaires.
 */
export const isPostHolidayFirstMorningSlot = (
  date: Date | string,
  time: number,
  holidays?: Holiday[],
  allowedDays: number[] = [2, 4]
): boolean => {
  if (Number(time) !== 9) return false;
  const postHolidayDays = getPostHolidayFirstDayStrings(holidays, allowedDays);
  const dateStr = typeof date === 'string' ? date : toYYYYMMDD(date);
  return postHolidayDays.has(dateStr);
};
