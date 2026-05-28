/**
 * @param {{
 *   value: string,
 *   onChange: (text: string) => void,
 *   onSubmit: () => void,
 *   error?: string,
 *   isParsing?: boolean,
 * }} props
 */
export default function SyllabusInput({ value, onChange, onSubmit, error, isParsing }) {
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isParsing) onSubmit();
  }

  const hasError = Boolean(error);

  return (
    <section aria-labelledby="input-heading" className="flex flex-col gap-3">
      <label
        id="input-heading"
        htmlFor="syllabus-text"
        className="text-sm font-semibold text-slate-700"
      >
        Paste your syllabus text below
      </label>

      <textarea
        id="syllabus-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={12}
        aria-describedby={hasError ? 'parse-error' : undefined}
        aria-invalid={hasError}
        placeholder={`Paste the full text of your syllabus here…\n\nExamples of supported formats:\n  Oct 24 - Midterm Exam\n  Due 11/15: Essay 1\n  09-02-2026 Homework 3\n  Final Paper due May 5`}
        className={`w-full rounded-lg border bg-white p-4 font-mono text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-y transition-colors ${
          hasError
            ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
        }`}
      />

      {/* ── Inline error message ───────────────────────────────────── */}
      {hasError && (
        <p
          id="parse-error"
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-base leading-none">⚠</span>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Tip: press{' '}
          <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-600">
            Ctrl+Enter
          </kbd>{' '}
          to parse
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isParsing}
          aria-busy={isParsing}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isParsing && (
            <svg
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {isParsing ? 'Parsing…' : 'Parse Deadlines'}
        </button>
      </div>
    </section>
  );
}
