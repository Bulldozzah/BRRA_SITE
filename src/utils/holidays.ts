/**
 * Zambian Public Holidays utility
 * Fetches public holidays from the database (public_holidays table).
 * Falls back to hardcoded defaults if DB is unavailable.
 * Used to exclude non-working days from leave calculations.
 */

import { supabase } from "@/integrations/supabase/client";

// ========== Cache for holiday dates loaded from DB ==========
let holidayCache: Map<string, boolean> = new Map();
let cacheLoaded = false;
let cachePromise: Promise<void> | null = null;

/**
 * Formats a date to YYYY-MM-DD string for cache key comparison.
 */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ========== Fallback: hardcoded holidays generator ==========
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getFallbackHolidays(year: number): string[] {
  const holidays: string[] = [];
  const add = (m: number, d: number) => {
    holidays.push(`${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  };

  add(1, 1);   // New Year's Day
  add(3, 8);   // International Women's Day
  add(3, 12);  // Youth Day
  add(4, 28);  // Kenneth Kaunda Day
  add(5, 1);   // Labour Day
  add(5, 25);  // Africa Freedom Day
  add(7, 6);   // Heroes' Day
  add(7, 7);   // Unity Day
  add(8, 3);   // Farmers' Day
  add(10, 18); // National Prayer Day
  add(10, 24); // Independence Day
  add(12, 25); // Christmas Day

  // Easter-based
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterSat = new Date(easter);
  easterSat.setDate(easter.getDate() - 1);
  const easterMon = new Date(easter);
  easterMon.setDate(easter.getDate() + 1);

  holidays.push(toDateKey(goodFriday));
  holidays.push(toDateKey(easterSat));
  holidays.push(toDateKey(easterMon));

  return holidays;
}

// ========== DB fetch ==========

/**
 * Loads public holidays from the database into the cache.
 * Call this once before using isNonWorkingDay in a session.
 */
export async function loadHolidaysFromDB(): Promise<void> {
  if (cacheLoaded) return;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("public_holidays")
        .select("holiday_date")
        .order("holiday_date");

      if (error) throw error;

      holidayCache = new Map();
      if (data && data.length > 0) {
        data.forEach((row: { holiday_date: string }) => {
          holidayCache.set(row.holiday_date, true);
        });
      } else {
        // No data in DB yet — populate cache with fallback for current + next year
        const currentYear = new Date().getFullYear();
        [currentYear, currentYear + 1, currentYear + 2].forEach((y) => {
          getFallbackHolidays(y).forEach((d) => holidayCache.set(d, true));
        });
      }
      cacheLoaded = true;
    } catch {
      // DB unavailable — use fallback
      const currentYear = new Date().getFullYear();
      [currentYear, currentYear + 1, currentYear + 2].forEach((y) => {
        getFallbackHolidays(y).forEach((d) => holidayCache.set(d, true));
      });
      cacheLoaded = true;
    }
  })();

  return cachePromise;
}

/**
 * Synchronous check — call loadHolidaysFromDB() first to populate cache.
 * If cache not loaded yet, uses fallback calculation.
 */
export function isPublicHoliday(date: Date): boolean {
  const key = toDateKey(date);
  if (cacheLoaded) {
    return holidayCache.has(key);
  }
  // Fallback if cache not yet loaded (shouldn't normally happen)
  const year = date.getFullYear();
  return getFallbackHolidays(year).includes(key);
}

/**
 * Checks if a given date is a non-working day (weekend or public holiday).
 */
export function isNonWorkingDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;
  return isPublicHoliday(date);
}

/**
 * Counts the number of working days between two dates (inclusive).
 * Excludes weekends and public holidays.
 */
export function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (!isNonWorkingDay(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Returns all cached holiday dates (for display purposes).
 */
export function getCachedHolidays(): string[] {
  return Array.from(holidayCache.keys()).sort();
}

/**
 * Returns fallback holidays for a year (exported for reference).
 */
export function getZambianPublicHolidays(year: number): Date[] {
  return getFallbackHolidays(year).map((d) => new Date(d + "T00:00:00"));
}

/**
 * Force-reloads holidays from DB (useful after admin adds a new holiday).
 */
export function invalidateHolidayCache(): void {
  cacheLoaded = false;
  cachePromise = null;
  holidayCache = new Map();
}
