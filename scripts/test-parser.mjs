/**
 * Standalone verification script for the parseDeadlines utility.
 * Run with: node scripts/test-parser.mjs
 */
import { parseDeadlines } from '../src/utils/parseDeadlines.js';

// ── Hardcoded sample covering the three canonical syllabus styles ─────────────

const SAMPLE_TEXT = `
Oct 24 - Midterm Exam
Due 11/15: Essay 1
09-02-2026 Homework 3
`;

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`      expected: ${JSON.stringify(expected)}`);
    console.error(`      received: ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── Run parser ────────────────────────────────────────────────────────────────

console.log('\nRunning parseDeadlines tests…\n');

const deadlines = parseDeadlines(SAMPLE_TEXT);

console.log(`Parsed ${deadlines.length} deadline(s):\n`);
deadlines.forEach((d) => console.log(`  [${d.date}] ${d.title}`));
console.log('');

// Results are sorted by date, so order is:
// 09-02-2026 → 2026-09-02  (Homework 3)
// Oct 24     → 2026-10-24  (Midterm Exam)
// 11/15      → 2026-11-15  (Essay 1)

assert('total deadlines extracted', deadlines.length, 3);

// ── Style A: numeric date "09-02-2026 Homework 3" ────────────────────────────
console.log('Style A — "09-02-2026 Homework 3"');
const hw = deadlines.find((d) => d.title === 'Homework 3');
assert('title', hw?.title, 'Homework 3');
assert('date',  hw?.date,  '2026-09-02');

// ── Style C: named month "Oct 24 - Midterm Exam" ─────────────────────────────
console.log('\nStyle C — "Oct 24 - Midterm Exam"');
const midterm = deadlines.find((d) => d.title === 'Midterm Exam');
assert('title', midterm?.title, 'Midterm Exam');
assert('date',  midterm?.date,  '2026-10-24');

// ── Style B: due-prefix "Due 11/15: Essay 1" ─────────────────────────────────
console.log('\nStyle B — "Due 11/15: Essay 1"');
const essay = deadlines.find((d) => d.title === 'Essay 1');
assert('title', essay?.title, 'Essay 1');
assert('date',  essay?.date,  '2026-11-15');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} assertions — ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
