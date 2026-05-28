/**
 * Verification script for the normalizeDate utility.
 * Run with: node scripts/test-normalize.mjs
 */
import { normalizeDate } from '../src/utils/normalizeDate.js';

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(input, expected) {
  const actual = normalizeDate(input);
  const ok = actual === expected;
  const icon = ok ? '✓' : '✗';
  console.log(`  ${icon}  normalizeDate("${input}") → ${actual ?? 'null'}`);
  if (!ok) {
    console.error(`       expected: ${expected}`);
    failed++;
  } else {
    passed++;
  }
}

// ── Required cases (from BUILD_LOG step 3) ────────────────────────────────────

console.log('\n── Required inputs ──────────────────────────────────────────');
assert('Sept 5',  '2026-09-05');
assert('12/25',   '2026-12-25');

// ── Named month variants ──────────────────────────────────────────────────────

console.log('\n── Named month formats ──────────────────────────────────────');
assert('September 5',       '2026-09-05');  // full month name, no year
assert('Oct 24',            '2026-10-24');  // abbreviation, no year
assert('January 1, 2026',   '2026-01-01');  // full month + year
assert('Feb 28, 2026',      '2026-02-28');  // abbreviation + year
assert('5 Sept',            '2026-09-05');  // day-first, no year
assert('24 October 2026',   '2026-10-24');  // day-first with year

// ── Numeric formats ───────────────────────────────────────────────────────────

console.log('\n── Numeric formats ──────────────────────────────────────────');
assert('09-02-2026',  '2026-09-02');  // MM-DD-YYYY
assert('09/02/2026',  '2026-09-02');  // MM/DD/YYYY
assert('9-5',         '2026-09-05');  // MM-DD, no year
assert('1/1',         '2026-01-01');  // single-digit month and day

// ── Edge cases ────────────────────────────────────────────────────────────────

console.log('\n── Edge cases ───────────────────────────────────────────────');
assert('',            null);           // empty string
assert('not a date',  null);           // no recognisable pattern
assert('   Dec 31  ', '2026-12-31');   // surrounding whitespace

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} assertions — ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
