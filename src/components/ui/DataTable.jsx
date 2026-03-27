import Spinner from "./Spinner";

export default function DataTable({
  columns,
  rows,
  rowKey = (r) => r._id,
  rowClassName,
  isLoading,
  emptyMessage = "No data",
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-medium text-zinc-600"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors ${rowClassName ? rowClassName(row) : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-zinc-800 align-middle">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
