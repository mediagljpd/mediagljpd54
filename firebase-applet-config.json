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
