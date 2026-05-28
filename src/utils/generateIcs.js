/**
 * generateIcs.js
 *
 * Converts an array of deadline objects into a valid iCalendar (.ics) string
 * per RFC 5545. No third-party libraries — pure string generation.
 *
 * Each deadline becomes an all-day VEVENT. The file can be imported directly
 * into Google Calendar, Apple Calendar, or Outlook.
 */

/**
 * Returns the current moment as an iCalendar DTSTAMP string (UTC).
 * Format: YYYYMMDDTHHmmssZ
 * @returns {string}
 */
function dtstamp() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Converts an ISO YYYY-MM-DD string to iCalendar DATE value YYYYMMDD.
 * @param {string} iso
 * @returns {string}
 */
function toIcsDate(iso) {
  return iso.replace(/-/g, '');
}

/**
 * Returns the calendar day after the given ISO date (for DTEND on all-day events).
 * @param {string} iso  - YYYY-MM-DD
 * @returns {string}    - YYYYMMDD
 */
function nextDay(iso) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return toIcsDate(d.toISOString().slice(0, 10));
}

/**
 * Generates a deterministic UID for a deadline event.
 * @param {string} id
 * @param {string} date
 * @returns {string}
 */
function makeUid(id, date) {
  return `${date}-${id}@syllabus-deadline-extractor`;
}

/**
 * Folds long iCalendar lines per RFC 5545 §3.1:
 * lines longer than 75 octets are split with CRLF + single space continuation.
 * @param {string} line
 * @returns {string}
 */
function foldLine(line) {
  if (line.length <= 75) return line;
  const chunks = [];
  chunks.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

/**
 * Escapes special characters in iCalendar text values (RFC 5545 §3.3.11).
 * @param {string} text
 * @returns {string}
 */
function escapeText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Builds a single VEVENT block for one deadline.
 *
 * @param {import('./parseDeadlines').Deadline} deadline
 * @param {string} stamp - shared DTSTAMP for the whole file
 * @returns {string}
 */
function buildVEvent(deadline, stamp) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${makeUid(deadline.id, deadline.date)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(deadline.date)}`,
    `DTEND;VALUE=DATE:${nextDay(deadline.date)}`,
    foldLine(`SUMMARY:${escapeText(deadline.title)}`),
    'END:VEVENT',
  ];
  return lines.join('\r\n');
}

/**
 * Converts an array of deadline objects into a complete iCalendar (.ics) string.
 *
 * @param {import('./parseDeadlines').Deadline[]} deadlines - Deadlines to include
 * @returns {string} Full RFC 5545-compliant .ics file content
 */
export function generateIcs(deadlines) {
  if (!Array.isArray(deadlines) || deadlines.length === 0) {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Syllabus Deadline Extractor//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  const stamp = dtstamp();
  const events = deadlines.map((dl) => buildVEvent(dl, stamp));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syllabus Deadline Extractor//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download of an .ics file using the Blob + anchor API.
 * This function is browser-only and will throw in a Node environment.
 *
 * @param {string} icsContent - Output of generateIcs()
 * @param {string} [filename]
 */
export function downloadIcs(icsContent, filename = 'deadlines.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
