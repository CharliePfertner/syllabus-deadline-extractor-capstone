import DeadlineRow from './DeadlineRow.jsx';

/**
 * @param {{
 *   deadlines: import('../utils/parseDeadlines').Deadline[],
 *   onToggle: (id: string) => void,
 *   onEdit: (id: string, field: 'title'|'date', value: string) => void,
 * }} props
 */
export default function DeadlineTable({ deadlines, onToggle, onEdit }) {
  if (deadlines.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        No deadlines extracted yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="min-w-full text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th scope="col" className="w-12 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Export
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assignment
            </th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Due Date
            </th>
          </tr>
        </thead>
        <tbody>
          {deadlines.map((dl) => (
            <DeadlineRow
              key={dl.id}
              deadline={dl}
              onToggle={onToggle}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
