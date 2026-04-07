export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data found' }) {
  return (
    <div className="bg-[#0c0c18] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0a0a12]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-xs font-semibold text-[#7a7a8e] uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors hover:bg-white/[0.02] ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-3.5 text-sm text-[#eeeef0] whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] ?? '\u2014'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm text-[#4a4a5e]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
