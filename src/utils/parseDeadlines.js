/** Zero-based month index for full names and common abbreviations. */
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

const DEFAULT_YEAR = new Date().getFullYear();

/**
 * Converts a zero-based month index, day, and optional year into ISO YYYY-MM-DD.
 * @param {number} monthIndex - 0-based (0 = January)
 * @param {string|number} day
 * @param {string|number|null} year
 * @returns {string|null}
 */
function buildIsoDate(monthIndex, day, year) {
  if (monthIndex < 0 || monthIndex > 11) return null;
  const y = year ? parseInt(year, 10) : DEFAULT_YEAR;
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(parseInt(day, 10)).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Normalises a 2- or 4-digit year string to a full integer year.
 * @param {string} raw
 * @returns {number}
 */
function normaliseYear(raw) {
  const n = parseInt(raw, 10);
  return raw.length === 2 ? 2000 + n : n;
}

/**
 * Each entry describes one recognised syllabus date format.
 * `regex`   – pattern applied to a single trimmed line.
 * `extract` – maps the match array to { title, isoDate } or null on bad data.
 *
 * Patterns are tried in order; the first successful match wins.
 */
const PATTERNS = [
  // ── Style A: "09-02-2026 Homework 3"  /  "09/02/2026 Homework 3"
  // Full MM-DD-YYYY (or MM/DD/YYYY) at the start of a line, title follows.
  {
    regex: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(.+)$/,
    extract([, month, day, yearRaw, title]) {
      return {
        isoDate: buildIsoDate(parseInt(month, 10) - 1, day, normaliseYear(yearRaw)),
        title: title.trim(),
      };
    },
  },

  // ── Style B: "Due 11/15: Essay 1"  /  "Due 11/15/2026: Essay 1"
  // Starts with "due" keyword (case-insensitive), numeric date MM/DD[/YYYY].
  {
    regex: /^[Dd]ue\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?[\s:–—,]+(.+)$/,
    extract([, month, day, yearRaw, title]) {
      const year = yearRaw ? normaliseYear(yearRaw) : DEFAULT_YEAR;
      return {
        isoDate: buildIsoDate(parseInt(month, 10) - 1, day, year),
        title: title.trim(),
      };
    },
  },

  // ── Style C: "Oct 24 - Midterm Exam"  /  "March 15, 2026 — Final Paper"
  // Named month (full or abbreviated) + day + optional year, then a separator and title.
  {
    regex: /^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?[\s\-:–—,]+(.+)$/,
    extract([, monthStr, day, yearRaw, title]) {
      const monthIndex = MONTH_MAP[monthStr.toLowerCase()];
      if (monthIndex === undefined) return null;
      return {
        isoDate: buildIsoDate(monthIndex, day, yearRaw ?? DEFAULT_YEAR),
        title: title.trim(),
      };
    },
  },

  // ── Style D: "Essay 1 – due Oct 24"  /  "Homework 2 due by March 3, 2026"
  // Title appears first; date follows a "due" keyword mid-line (named month).
  {
    regex: /^(.+?)\s+due(?:\s+by)?\s+([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/i,
    extract([, title, monthStr, day, yearRaw]) {
      const monthIndex = MONTH_MAP[monthStr.toLowerCase()];
      if (monthIndex === undefined) return null;
      return {
        isoDate: buildIsoDate(monthIndex, day, yearRaw ?? DEFAULT_YEAR),
        title: title.trim(),
      };
    },
  },

  // ── Style E: "Due April 7: Title"  /  "Due March 3, 2026 – Title"
  // Starts with "due" keyword followed by a named month (not numeric).
  {
    regex: /^[Dd]ue\s+([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?[\s:–—,]+(.+)$/,
    extract([, monthStr, day, yearRaw, title]) {
      const monthIndex = MONTH_MAP[monthStr.toLowerCase()];
      if (monthIndex === undefined) return null;
      return {
        isoDate: buildIsoDate(monthIndex, day, yearRaw ?? DEFAULT_YEAR),
        title: title.trim(),
      };
    },
  },

  // ── Style F: "Title due MM/DD/YYYY"  /  "Quiz #3 due 05/05/2026"
  // Title appears first; numeric date follows a "due" keyword.
  {
    regex: /^(.+?)\s+due(?:\s+by)?\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/i,
    extract([, title, month, day, yearRaw]) {
      const year = yearRaw ? normaliseYear(yearRaw) : DEFAULT_YEAR;
      return {
        isoDate: buildIsoDate(parseInt(month, 10) - 1, day, year),
        title: title.trim(),
      };
    },
  },
];

/**
 * @typedef {Object} Deadline
 * @property {string}  id      - Stable key derived from line position
 * @property {string}  title   - Human-readable assignment name
 * @property {string}  date    - ISO 8601 date string (YYYY-MM-DD)
 * @property {boolean} checked - Starts unchecked
 */

/**
 * Parses raw syllabus text and returns deadline objects sorted by date.
 *
 * @param {string} text - Unstructured syllabus content (multi-line)
 * @returns {Deadline[]}
 */
export function parseDeadlines(text) {
  if (!text || typeof text !== 'string') return [];

  const results = [];

  text.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) return;

    for (const { regex, extract } of PATTERNS) {
      const match = line.match(regex);
      if (!match) continue;

      const result = extract(match);
      if (!result || !result.isoDate) continue;

      results.push({
        id: `deadline-${lineIndex}`,
        title: result.title,
        date: result.isoDate,
        checked: false,
      });
      break; // first matching pattern wins; move to next line
    }
  });

  return results.sort((a, b) => a.date.localeCompare(b.date));
}
