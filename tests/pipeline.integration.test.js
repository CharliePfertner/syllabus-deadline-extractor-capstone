/**
 * Integration tests: parseDeadlines → filter → generateIcs pipeline.
 *
 * These tests verify that the two core utilities work correctly together —
 * raw syllabus text in, valid iCalendar (.ics) content out — including
 * selection filtering, date formatting, line folding, and text escaping.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeadlines } from '../src/utils/parseDeadlines.js';
import { generateIcs }    from '../src/utils/generateIcs.js';

// ── shared helpers ────────────────────────────────────────────────────────────

/**
 * Runs the full pipeline: parse text → mark all checked → generate ICS.
 * @param {string} text
 * @returns {string} raw .ics content
 */
function pipeline(text) {
  const deadlines = parseDeadlines(text).map((d) => ({ ...d, checked: true }));
  return generateIcs(deadlines);
}

/** Returns the lines of an ICS string (split on CRLF). */
function lines(ics) {
  return ics.split('\r\n');
}

// ── ICS structure ─────────────────────────────────────────────────────────────

describe('ICS structure', () => {
  const SAMPLE = 'Oct 24 - Midterm Exam\nDue 11/15: Essay 1\n09-02-2026 Homework 3';

  it('output starts with BEGIN:VCALENDAR and ends with END:VCALENDAR', () => {
    const ics = pipeline(SAMPLE);
    assert.equal(lines(ics).at(0),  'BEGIN:VCALENDAR');
    assert.equal(lines(ics).at(-1), 'END:VCALENDAR');
  });

  it('contains required VCALENDAR header fields', () => {
    const ics = pipeline(SAMPLE);
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('PRODID:'));
    assert.ok(ics.includes('CALSCALE:GREGORIAN'));
    assert.ok(ics.includes('METHOD:PUBLISH'));
  });

  it('uses CRLF line endings throughout (RFC 5545 §3.1)', () => {
    const ics = pipeline(SAMPLE);
    // Every line break must be \r\n — no bare \n
    assert.ok(ics.includes('\r\n'));
    assert.ok(!ics.replace(/\r\n/g, '').includes('\n'));
  });

  it('produces one VEVENT block per parsed deadline', () => {
    const ics = pipeline(SAMPLE);
    const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    assert.equal(count, 3);
  });
});

// ── date formatting ───────────────────────────────────────────────────────────

describe('date formatting inside VEVENT', () => {
  it('formats DTSTART as VALUE=DATE:YYYYMMDD (all-day, no time component)', () => {
    const ics = pipeline('March 15 - Midterm Exam');
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20260315'));
  });

  it('sets DTEND to the calendar day after DTSTART', () => {
    const ics = pipeline('March 15 - Midterm Exam');
    assert.ok(ics.includes('DTEND;VALUE=DATE:20260316'));
  });

  it('DTEND correctly rolls over month boundary (e.g. Jan 31 → Feb 01)', () => {
    const ics = pipeline('Jan 31 - Last Day Assignment');
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20260131'));
    assert.ok(ics.includes('DTEND;VALUE=DATE:20260201'));
  });

  it('DTEND correctly rolls over year boundary (e.g. Dec 31 → Jan 01)', () => {
    const ics = pipeline('December 31 - Year-End Submission due Dec 31');
    // The title ends with "due Dec 31" so Style D extracts it
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20261231'));
    assert.ok(ics.includes('DTEND;VALUE=DATE:20270101'));
  });

  it('contains no TZID — all-day VALUE=DATE events are timezone-agnostic', () => {
    const ics = pipeline('Oct 24 - Midterm');
    assert.ok(!ics.includes('TZID'));
  });
});

// ── selection filtering ───────────────────────────────────────────────────────

describe('selection filtering', () => {
  const TEXT = 'Oct 24 - Midterm Exam\nDue 11/15: Essay 1\n09-02-2026 Homework 3';

  it('includes only checked deadlines in the ICS output', () => {
    const deadlines = parseDeadlines(TEXT).map((d) => ({
      ...d,
      checked: !d.title.includes('Essay'), // explicitly exclude Essay 1 by title
    }));
    const ics = generateIcs(deadlines.filter((d) => d.checked));
    assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
    assert.ok(!ics.includes('Essay 1'));
  });

  it('includes all three when all are checked', () => {
    const deadlines = parseDeadlines(TEXT).map((d) => ({ ...d, checked: true }));
    const ics = generateIcs(deadlines.filter((d) => d.checked));
    assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 3);
  });

  it('returns a valid empty calendar when no items are selected', () => {
    const ics = generateIcs([]);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('END:VCALENDAR'));
    assert.ok(!ics.includes('BEGIN:VEVENT'));
  });
});

// ── title propagation ─────────────────────────────────────────────────────────

describe('title propagation', () => {
  it('carries the parsed title through to the SUMMARY field', () => {
    const ics = pipeline('Oct 24 - Midterm Exam');
    assert.ok(ics.includes('SUMMARY:Midterm Exam'));
  });

  it('escapes commas in titles per RFC 5545', () => {
    const deadlines = [{ id: 'x', title: 'Quiz, Chapter 3', date: '2026-03-01', checked: true }];
    const ics = generateIcs(deadlines);
    assert.ok(ics.includes('SUMMARY:Quiz\\, Chapter 3'));
  });

  it('escapes backslashes in titles per RFC 5545', () => {
    const deadlines = [{ id: 'x', title: 'N/A\\TBD Assignment', date: '2026-03-01', checked: true }];
    const ics = generateIcs(deadlines);
    assert.ok(ics.includes('SUMMARY:N/A\\\\TBD Assignment'));
  });

  it('folds SUMMARY lines longer than 75 octets with CRLF + space', () => {
    const longTitle = 'A'.repeat(80);
    const deadlines = [{ id: 'x', title: longTitle, date: '2026-03-01', checked: true }];
    const ics = generateIcs(deadlines);
    // A folded line begins with a space on the continuation
    assert.ok(ics.includes('\r\n '));
    // The full title is still recoverable by joining folded segments
    const unfolded = ics.replace(/\r\n /g, '');
    assert.ok(unfolded.includes(`SUMMARY:${longTitle}`));
  });
});

// ── full realistic pipeline ───────────────────────────────────────────────────

describe('realistic end-to-end pipeline', () => {
  const SYLLABUS = `
HIST 204: Modern American History — Spring 2026

Jan 20 – Week 1 Reading: Chapters 1-2
Quiz 1 (online) due Jan 27
February 3 - Discussion Post #1
Due 02/10: Response Paper #1 (500 words)
Feb 17 – In-Class Essay (bring blue book)
Reading Quiz #2 due February 24
Due 3/3: Primary Source Analysis
March 10 - Midterm Exam (covers Units 1-2)
Due April 7: Annotated Bibliography (8 sources)
Reading Quiz #3 due 05/05/2026
Final Exam due May 15, 2026
  `.trim();

  it('extracts all 11 deadlines and generates 11 VEVENTs', () => {
    const deadlines = parseDeadlines(SYLLABUS).map((d) => ({ ...d, checked: true }));
    const ics = generateIcs(deadlines.filter((d) => d.checked));
    assert.equal(deadlines.length, 11);
    assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 11);
  });

  it('Midterm lands on 2026-03-10 in the ICS', () => {
    const ics = pipeline(SYLLABUS);
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20260310'));
  });

  it('Final Exam lands on 2026-05-15 in the ICS', () => {
    const ics = pipeline(SYLLABUS);
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20260515'));
  });

  it('Annotated Bibliography (Style E) lands on 2026-04-07', () => {
    const ics = pipeline(SYLLABUS);
    assert.ok(ics.includes('DTSTART;VALUE=DATE:20260407'));
  });

  it('every VEVENT has a unique UID', () => {
    const deadlines = parseDeadlines(SYLLABUS).map((d) => ({ ...d, checked: true }));
    const ics = generateIcs(deadlines);
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]);
    assert.equal(new Set(uids).size, uids.length, 'all UIDs are unique');
  });
});
