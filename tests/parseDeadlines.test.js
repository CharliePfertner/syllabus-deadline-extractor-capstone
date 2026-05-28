import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeadlines } from '../src/utils/parseDeadlines.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Find the first deadline whose title contains a substring. */
function find(results, substr) {
  return results.find((d) => d.title.includes(substr));
}

// ── input guards ──────────────────────────────────────────────────────────────

describe('input guards', () => {
  it('returns [] for an empty string', () => {
    assert.deepEqual(parseDeadlines(''), []);
  });

  it('returns [] for a whitespace-only string', () => {
    assert.deepEqual(parseDeadlines('   \n\t  '), []);
  });

  it('returns [] for null / undefined', () => {
    assert.deepEqual(parseDeadlines(null), []);
    assert.deepEqual(parseDeadlines(undefined), []);
  });

  it('returns [] when text contains no recognisable dates', () => {
    const result = parseDeadlines('This syllabus has no dates at all. Just prose.');
    assert.deepEqual(result, []);
  });
});

// ── date format styles ────────────────────────────────────────────────────────

describe('Style A — MM-DD-YYYY at line start', () => {
  it('parses "09-02-2026 Homework 3"', () => {
    const [dl] = parseDeadlines('09-02-2026 Homework 3');
    assert.equal(dl.title, 'Homework 3');
    assert.equal(dl.date,  '2026-09-02');
  });

  it('parses MM/DD/YYYY variant', () => {
    const [dl] = parseDeadlines('11/15/2026 Final Project');
    assert.equal(dl.date, '2026-11-15');
  });
});

describe('Style B — "Due MM/DD[/YYYY]: title"', () => {
  it('parses "Due 11/15: Essay 1"', () => {
    const [dl] = parseDeadlines('Due 11/15: Essay 1');
    assert.equal(dl.title, 'Essay 1');
    assert.equal(dl.date,  '2026-11-15');
  });

  it('parses with explicit year "Due 3/3/2026: Analysis"', () => {
    const [dl] = parseDeadlines('Due 3/3/2026: Analysis');
    assert.equal(dl.date, '2026-03-03');
  });
});

describe('Style C — "MonthName DD – title"', () => {
  it('parses "Oct 24 - Midterm Exam"', () => {
    const [dl] = parseDeadlines('Oct 24 - Midterm Exam');
    assert.equal(dl.title, 'Midterm Exam');
    assert.equal(dl.date,  '2026-10-24');
  });

  it('parses full month name "February 3 - Discussion Post #1"', () => {
    const [dl] = parseDeadlines('February 3 - Discussion Post #1');
    assert.equal(dl.date, '2026-02-03');
  });

  it('parses with explicit year "March 10, 2026 - Midterm"', () => {
    const [dl] = parseDeadlines('March 10, 2026 - Midterm');
    assert.equal(dl.date, '2026-03-10');
  });
});

describe('Style D — "title due MonthName DD"', () => {
  it('parses "Research Paper Peer Review due April 21"', () => {
    const [dl] = parseDeadlines('Research Paper Peer Review due April 21');
    assert.equal(dl.title, 'Research Paper Peer Review');
    assert.equal(dl.date,  '2026-04-21');
  });

  it('parses "Homework 2 due by March 3, 2026"', () => {
    const [dl] = parseDeadlines('Homework 2 due by March 3, 2026');
    assert.equal(dl.date, '2026-03-03');
  });
});

describe('Style E — "Due MonthName DD: title"', () => {
  it('parses "Due April 7: Annotated Bibliography"', () => {
    const [dl] = parseDeadlines('Due April 7: Annotated Bibliography (8 sources minimum)');
    assert.equal(dl.title, 'Annotated Bibliography (8 sources minimum)');
    assert.equal(dl.date,  '2026-04-07');
  });
});

describe('Style F — "title due MM/DD/YYYY"', () => {
  it('parses "Reading Quiz #3 due 05/05/2026"', () => {
    const [dl] = parseDeadlines('Reading Quiz #3 due 05/05/2026');
    assert.equal(dl.title, 'Reading Quiz #3');
    assert.equal(dl.date,  '2026-05-05');
  });
});

// ── default year behaviour ────────────────────────────────────────────────────

describe('default year', () => {
  it('defaults to the current year when no year is present', () => {
    const [dl] = parseDeadlines('Oct 24 - Midterm Exam');
    assert.equal(dl.date.slice(0, 4), String(new Date().getFullYear()));
  });
});

// ── output shape & sorting ────────────────────────────────────────────────────

describe('output shape', () => {
  it('every deadline has id, title, date, and checked=false', () => {
    const [dl] = parseDeadlines('Due 11/15: Essay 1');
    assert.ok(dl.id,                            'has id');
    assert.equal(typeof dl.title,  'string',    'title is string');
    assert.match(dl.date, /^\d{4}-\d{2}-\d{2}/, 'date is ISO YYYY-MM-DD');
    assert.equal(dl.checked, false,              'checked defaults to false');
  });

  it('results are sorted ascending by date', () => {
    const text = [
      'Due 11/15: Essay',
      'Oct 24 - Midterm',
      'Feb 3 - Quiz',
    ].join('\n');
    const results = parseDeadlines(text);
    const dates = results.map((d) => d.date);
    assert.deepEqual(dates, [...dates].sort());
  });

  it('each deadline gets a unique id', () => {
    const text = 'Oct 24 - Midterm\nNov 15 - Final';
    const results = parseDeadlines(text);
    const ids = results.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

// ── multi-line realistic syllabus ─────────────────────────────────────────────

describe('realistic multi-line syllabus', () => {
  const SYLLABUS = `
HIST 204 Spring 2026

Jan 20 – Week 1 Reading: Chapters 1-2
Quiz 1 (online) due Jan 27
February 3 - Discussion Post #1
Due 02/10: Response Paper #1
Feb 17 – In-Class Essay
Reading Quiz #2 due February 24
Due April 7: Annotated Bibliography
Reading Quiz #3 due 05/05/2026
Final Exam due May 15, 2026
  `.trim();

  it('extracts all 9 deadlines', () => {
    assert.equal(parseDeadlines(SYLLABUS).length, 9);
  });

  it('correctly parses the Annotated Bibliography date', () => {
    const dl = find(parseDeadlines(SYLLABUS), 'Annotated');
    assert.equal(dl?.date, '2026-04-07');
  });

  it('ignores the course-header line (no date)', () => {
    const titles = parseDeadlines(SYLLABUS).map((d) => d.title);
    assert.ok(!titles.some((t) => t.includes('HIST 204')));
  });

  it('output is chronologically sorted', () => {
    const dates = parseDeadlines(SYLLABUS).map((d) => d.date);
    assert.deepEqual(dates, [...dates].sort());
  });
});
