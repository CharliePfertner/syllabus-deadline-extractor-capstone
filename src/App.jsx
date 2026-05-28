import { useState, useMemo } from 'react';
import SyllabusInput from './components/SyllabusInput.jsx';
import DeadlineTable from './components/DeadlineTable.jsx';
import { parseDeadlines } from './utils/parseDeadlines.js';
import { generateIcs, downloadIcs } from './utils/generateIcs.js';

export default function App() {
  const [syllabusText, setSyllabusText] = useState('');
  const [deadlines, setDeadlines] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  /** Clear error whenever the user edits the textarea. */
  function handleTextChange(text) {
    setSyllabusText(text);
    if (parseError) setParseError('');
  }

  /**
   * Validate, then defer the synchronous parse into a setTimeout(0) so React
   * can commit the isParsing=true render (spinner) before the work blocks.
   */
  function handleParse() {
    if (!syllabusText.trim()) {
      setParseError('Please paste some syllabus text before extracting.');
      return;
    }
    setParseError('');
    setIsParsing(true);

    setTimeout(() => {
      const results = parseDeadlines(syllabusText).map((dl) => ({ ...dl, checked: true }));
      setIsParsing(false);

      if (results.length === 0) {
        setParseError(
          'No deadlines found. Make sure your syllabus includes dates (e.g. "Oct 24 - Midterm" or "Due 11/15: Essay 1").'
        );
        return;
      }

      console.log(`[Syllabus Extractor] Parsed ${results.length} deadline(s):`, results);
      setDeadlines(results);
    }, 0);
  }

  /** Toggle one row's checked state. */
  function handleToggle(id) {
    setDeadlines((prev) =>
      prev.map((dl) => (dl.id === id ? { ...dl, checked: !dl.checked } : dl))
    );
  }

  /** In-place edit of title or date for one row. */
  function handleEdit(id, field, value) {
    setDeadlines((prev) =>
      prev.map((dl) => (dl.id === id ? { ...dl, [field]: value } : dl))
    );
  }

  /** Filter to checked rows, generate ICS string, trigger browser download. */
  function handleExport() {
    const selected = deadlines.filter((dl) => dl.checked);
    if (selected.length === 0) return;
    const icsContent = generateIcs(selected);
    downloadIcs(icsContent, 'syllabi_deadlines.ics');
  }

  const selectedCount = useMemo(
    () => deadlines.filter((dl) => dl.checked).length,
    [deadlines]
  );
  const hasResults = deadlines.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Syllabus Deadline Extractor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Paste your course syllabus, extract every deadline, export to your calendar.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 flex flex-col gap-10">

        {/* ── Input section ─────────────────────────────────────────── */}
        <SyllabusInput
          value={syllabusText}
          onChange={handleTextChange}
          onSubmit={handleParse}
          error={parseError}
          isParsing={isParsing}
        />

        {/* ── Results section ───────────────────────────────────────── */}
        {hasResults && (
          <section aria-labelledby="results-heading" className="flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <h2
                id="results-heading"
                className="text-base font-semibold text-slate-700"
              >
                Extracted Deadlines
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {deadlines.length}
                </span>
              </h2>

              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600">{selectedCount}</span>
                  {' of '}
                  {deadlines.length} selected for export
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={selectedCount === 0}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Download Calendar File
                </button>
              </div>
            </div>

            <DeadlineTable
              deadlines={deadlines}
              onToggle={handleToggle}
              onEdit={handleEdit}
            />

          </section>
        )}

      </main>
    </div>
  );
}
