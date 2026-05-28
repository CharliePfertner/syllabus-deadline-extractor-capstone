/**
 * @param {{
 *   deadline: import('../utils/parseDeadlines').Deadline,
 *   onToggle: (id: string) => void,
 *   onEdit: (id: string, field: 'title'|'date', value: string) => void,
 * }} props
 */
export default function DeadlineRow({ deadline, onToggle, onEdit }) {
  const { id, title, date, checked } = deadline;

  return (
    <tr className={`border-b border-slate-100 transition-colors ${!checked ? 'bg-slate-50' : 'bg-white hover:bg-emerald-50/30'}`}>

      {/* ── Checkbox ──────────────────────────────────────────────── */}
      <td className="w-12 px-4 py-3 text-center align-middle">
        <label htmlFor={`check-${id}`} className="sr-only">
          Include "{title}" in export
        </label>
        <input
          id={`check-${id}`}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(id)}
          className="h-4 w-4 cursor-pointer rounded accent-emerald-600"
        />
      </td>

      {/* ── Title ─────────────────────────────────────────────────── */}
      <td className="px-4 py-3 align-middle">
        <label htmlFor={`title-${id}`} className="sr-only">
          Assignment title
        </label>
        <input
          id={`title-${id}`}
          type="text"
          value={title}
          onChange={(e) => onEdit(id, 'title', e.target.value)}
          className={`w-full bg-transparent text-sm focus:outline-none focus:border-b focus:border-emerald-400 transition-colors ${
            !checked ? 'text-slate-400 line-through' : 'text-slate-800'
          }`}
          aria-label="Assignment title"
        />
      </td>

      {/* ── Date ──────────────────────────────────────────────────── */}
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        <label htmlFor={`date-${id}`} className="sr-only">
          Due date
        </label>
        <input
          id={`date-${id}`}
          type="date"
          value={date}
          onChange={(e) => onEdit(id, 'date', e.target.value)}
          className={`bg-transparent text-sm focus:outline-none focus:border-b focus:border-emerald-400 transition-colors ${
            !checked ? 'text-slate-400' : 'text-slate-600'
          }`}
          aria-label="Due date"
        />
      </td>

    </tr>
  );
}
