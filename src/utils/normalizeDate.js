/**
 * normalizeDate.js
 *
 * Standalone date-string normalizer. Accepts a raw fragment extracted from a
 * syllabus line and returns a strict ISO YYYY-MM-DD string.
 *
 * No third-party libraries — pure RegExp + native Date arithmetic.
 */

/** @type {Record<string, number>} Zero-based month index keyed by name/abbreviation. */
const MONTH_MAP = {
  january: 0,  jan: 0,
  february: 1, feb: 1,
  march: 2,    mar: 2,
  april: 3,    apr: 3,
  may: 4,
  june: 5,     jun: 5,
  july: 6,     jul: 6,
  august: 7,   aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9,  oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/** Year to use when the source string omits one. */
const DEFAULT_YEAR = new Date().getFullYear();

/**
 * Builds an ISO date string from its components.
 *
 * @param {number} monthIndex - Zero-based (0 = January)
 * @param {string|number} day
 * @param {string|number} year
 * @returns {string|null}
 */
function buildIso(monthIndex, day, year) {
  if (monthIndex < 0 || monthIndex > 11) return null;
  const y = parseInt(year, 10);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(parseInt(day, 10)).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Expands a 2-digit year to a full 4-digit year (assumes 2000s).
 * @param {string} raw
 * @returns {number}
 */
function expandYear(raw) {
  const n = parseInt(raw, 10);
  return raw.length === 2 ? 2000 + n : n;
}

/**
 * Ordered list of date patterns the normalizer recognises.
 * Each entry has a `regex` and an `extract` function that maps match groups
 * to { monthIndex, day, year }.
 */
const DATE_PATTERNS = [
  // ── Numeric with full year ────────────────────────────────────────────────
  // "12/25/2026"  "09-02-2026"  "09/02/26"
  {
    regex: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/,
    extract: ([, month, day, yr]) => ({
      monthIndex: parseInt(month, 10) - 1,
      day,
      year: expandYear(yr),
    }),
  },

  // ── Numeric without year ─────────────────────────────────────────────────
  // "12/25"  "9-5"
  {
    regex: /^(\d{1,2})[\/\-](\d{1,2})$/,
    extract: ([, month, day]) => ({
      monthIndex: parseInt(month, 10) - 1,
      day,
      year: DEFAULT_YEAR,
    }),
  },

  // ── Named month + day + year ─────────────────────────────────────────────
  // "September 5, 2026"  "Sept 5 2026"  "Oct 24, 2026"
  {
    regex: /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    extract: ([, monthStr, day, yr]) => ({
      monthIndex: MONTH_MAP[monthStr.toLowerCase()],
      day,
      year: parseInt(yr, 10),
    }),
  },

  // ── Named month + day (no year) ──────────────────────────────────────────
  // "Sept 5"  "October 24"  "Jan 1"
  {
    regex: /^([A-Za-z]+)\s+(\d{1,2})$/,
    extract: ([, monthStr, day]) => ({
      monthIndex: MONTH_MAP[monthStr.toLowerCase()],
      day,
      year: DEFAULT_YEAR,
    }),
  },

  // ── Day + named month + year ─────────────────────────────────────────────
  // "5 September 2026"  "24 Oct 2026"
  {
    regex: /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
    extract: ([, day, monthStr, yr]) => ({
      monthIndex: MONTH_MAP[monthStr.toLowerCase()],
      day,
      year: parseInt(yr, 10),
    }),
  },

  // ── Day + named month (no year) ──────────────────────────────────────────
  // "5 Sept"  "24 October"
  {
    regex: /^(\d{1,2})\s+([A-Za-z]+)$/,
    extract: ([, day, monthStr]) => ({
      monthIndex: MONTH_MAP[monthStr.toLowerCase()],
      day,
      year: DEFAULT_YEAR,
    }),
  },
];

/**
 * Normalizes a raw date string fragment into strict ISO YYYY-MM-DD format.
 *
 * Handles named months (full and abbreviated), numeric MM/DD and MM-DD,
 * and optional year fields. Defaults to the current year when the year is
 * absent.
 *
 * @param {string} raw - A date string such as "Sept 5", "12/25", "Oct 24, 2026"
 * @returns {string|null} Normalized ISO date, or null if the input is unrecognized
 *
 * @example
 * normalizeDate('Sept 5')      // → "2026-09-05"
 * normalizeDate('12/25')       // → "2026-12-25"
 * normalizeDate('Oct 24, 2026')// → "2026-10-24"
 * normalizeDate('09-02-2026')  // → "2026-09-02"
 */
export function normalizeDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();

  for (const { regex, extract } of DATE_PATTERNS) {
    const match = s.match(regex);
    if (!match) continue;

    const { monthIndex, day, year } = extract(match);
    if (monthIndex === undefined || monthIndex === null) continue;

    const iso = buildIso(monthIndex, day, year);
    if (iso) return iso;
  }

  return null;
}
