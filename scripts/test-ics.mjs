/**
 * Verification script for the generateIcs utility.
 * Run with: node scripts/test-ics.mjs
 */
import { generateIcs } from '../src/utils/generateIcs.js';

// ── Mock deadline objects (same shape as parseDeadlines output) ───────────────

const MOCK_DEADLINES = [
  { id: 'deadline-0', title: 'Midterm Exam',  date: '2026-10-24', checked: false },
  { id: 'deadline-1', title: 'Essay 1',        date: '2026-11-15', checked: false },
  { id: 'deadline-2', title: 'Homework 3',     date: '2026-09-02', checked: false },
];

// ── Generate output ───────────────────────────────────────────────────────────

const output = generateIcs(MOCK_DEADLINES);

console.log('\n── Raw .ics output ──────────────────────────────────────────\n');
console.log(output);

// ── Assertions ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log('\n── Structural assertions ─────────────────────────────────────');

assert('Contains BEGIN:VCALENDAR',        output.includes('BEGIN:VCALENDAR'));
assert('Contains END:VCALENDAR',          output.includes('END:VCALENDAR'));
assert('Contains VERSION:2.0',            output.includes('VERSION:2.0'));
assert('Contains PRODID',                 output.includes('PRODID:'));
assert('Contains CALSCALE:GREGORIAN',     output.includes('CALSCALE:GREGORIAN'));

assert('Contains 3× BEGIN:VEVENT',        (output.match(/BEGIN:VEVENT/g) ?? []).length === 3);
assert('Contains 3× END:VEVENT',          (output.match(/END:VEVENT/g) ?? []).length === 3);

assert('Contains DTSTART for Homework 3', output.includes('DTSTART;VALUE=DATE:20260902'));
assert('Contains DTSTART for Midterm',    output.includes('DTSTART;VALUE=DATE:20261024'));
assert('Contains DTSTART for Essay 1',    output.includes('DTSTART;VALUE=DATE:20261115'));

assert('Contains SUMMARY:Midterm Exam',   output.includes('SUMMARY:Midterm Exam'));
assert('Contains SUMMARY:Essay 1',        output.includes('SUMMARY:Essay 1'));
assert('Contains SUMMARY:Homework 3',     output.includes('SUMMARY:Homework 3'));

assert('Contains DTSTAMP',                output.includes('DTSTAMP:'));
assert('Contains UID fields',             output.includes('@syllabus-deadline-extractor'));

assert('Uses CRLF line endings',          output.includes('\r\n'));
assert('Starts with BEGIN:VCALENDAR',     output.startsWith('BEGIN:VCALENDAR'));
assert('Ends with END:VCALENDAR',         output.trimEnd().endsWith('END:VCALENDAR'));

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} assertions — ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
