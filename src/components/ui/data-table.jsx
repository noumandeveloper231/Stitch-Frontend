import React from "react";
import { cn } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DataTable({
  columns = [],
  rows = [],
  isLoading = false,
  emptyMessage = "No results",
  rowClassName,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} style={column.width ? { width: column.width } : undefined}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={Math.max(columns.length, 1)} className="py-8 text-center">
                <Spinner />
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row, index) => (
              <TableRow
                key={row?._id ?? index}
                className={cn(typeof rowClassName === "function" ? rowClassName(row) : "")}
              >
                {columns.map((column) => (
                  <TableCell key={`${row?._id ?? index}-${column.key}`}>
                    {column.render ? column.render(row) : row?.[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={Math.max(columns.length, 1)}
                className="py-8 text-center text-sm text-zinc-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;

