"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Loader from "@/components/Loader";

export function DataTable({
  columns,
  data: dataProp,
  rows: rowsProp,
  renderRowActions,
  pageSize: pageSizeProp,
  onSelectionChange,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  addPagination = true,
  enableSelection = true,
  getRowId: getRowIdProp,
  containerClassName,
  getRowProps,
  /** When false, table container grows with content (no fixed 500px height). Default true. */
  fixedHeight = true,
  /** When false, header cells are not wrapped in context menu (e.g. for import/input tables). Default true. */
  enableHeaderContextMenu = true,
  /** Optional: initial page index (0-based) for pagination. */
  initialPageIndex,
  /** Optional: called whenever page index changes (0-based). */
  onPageChange,
  queryKey,
  queryFn,
  queryOptions = {},
  isLoading: isLoadingProp,
  emptyMessage = "No results.",
}) {
  const [sorting, setSorting] = React.useState({ id: null, direction: null });
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [internalRowSelection, setInternalRowSelection] = React.useState({});
  const isControlled = rowSelectionProp !== undefined;
  const rowSelection = isControlled ? rowSelectionProp ?? {} : internalRowSelection;
  const setRowSelection = React.useCallback(
    (updater) => {
      if (isControlled) {
        if (typeof onRowSelectionChange === "function") {
          const next = typeof updater === "function" ? updater(rowSelection) : updater;
          onRowSelectionChange(next);
        }
      } else {
        setInternalRowSelection(updater);
      }
    },
    [isControlled, onRowSelectionChange, rowSelection]
  );

  const hasQuery = Boolean(queryKey && queryFn);
  const [queryData, setQueryData] = React.useState([]);
  const [queryLoading, setQueryLoading] = React.useState(false);
  const [queryError, setQueryError] = React.useState(null);
  const queryKeyString = React.useMemo(
    () => JSON.stringify(queryKey ?? ["data-table"]),
    [queryKey]
  );

  React.useEffect(() => {
    if (!hasQuery) return undefined;
    const { enabled = true } = queryOptions ?? {};
    if (!enabled) return undefined;

    let cancelled = false;
    const load = async () => {
      setQueryLoading(true);
      setQueryError(null);
      try {
        const result = await queryFn();
        if (!cancelled) setQueryData(result ?? []);
      } catch (err) {
        if (!cancelled) setQueryError(err);
      } finally {
        if (!cancelled) setQueryLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [hasQuery, queryFn, queryOptions, queryKeyString]);

  const data = hasQuery ? (queryData ?? []) : (dataProp ?? rowsProp ?? []);
  const isTableLoading = hasQuery ? queryLoading : Boolean(isLoadingProp);
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const effectivePageSize = addPagination
    ? (pageSizeProp || 10)
    : (data?.length ?? 0) || 10;
  const [pagination, setPagination] = React.useState(() => ({
    pageIndex: initialPageIndex ?? 0,
    pageSize: effectivePageSize,
  }));

  React.useEffect(() => {
    if (!addPagination && data?.length != null) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: 0,
        pageSize: Math.max(1, data.length),
      }));
    } else if (addPagination) {
      setPagination((prev) => {
        const nextPageSize = pageSizeProp || 10;
        const totalRows = data?.length ?? 0;
        const maxPageIndex =
          nextPageSize > 0 ? Math.max(0, Math.ceil(totalRows / nextPageSize) - 1) : 0;
        const nextPageIndex =
          prev.pageIndex > maxPageIndex ? maxPageIndex : prev.pageIndex;
        return {
          pageIndex: nextPageIndex,
          pageSize: nextPageSize,
        };
      });
    }
  }, [addPagination, data?.length, pageSizeProp]);

  const handlePaginationChange = React.useCallback(
    (updater) => {
      setPagination((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater;
        if (
          addPagination &&
          typeof onPageChange === "function" &&
          next.pageIndex !== prev.pageIndex
        ) {
          onPageChange(next.pageIndex);
        }
        return next;
      });
    },
    [addPagination, onPageChange],
  );

  const normalizedColumns = React.useMemo(
    () =>
      (columns ?? []).map((column, index) => {
        const id =
          column.id ??
          column.accessorKey ??
          column.key ??
          `col-${index}`;
        return { ...column, id };
      }),
    [columns]
  );

  const getRowId = React.useCallback(
    (row, index) => {
      if (getRowIdProp) return getRowIdProp(row, index);
      return row?._rowId ?? row?.id ?? row?._id ?? String(index);
    },
    [getRowIdProp]
  );

  const dataRows = React.useMemo(
    () =>
      (data ?? []).map((row, index) => ({
        id: getRowId(row, index),
        original: row,
        index,
      })),
    [data, getRowId]
  );

  const getCellValue = React.useCallback((row, column) => {
    const key = column.accessorKey ?? column.key;
    return key ? row?.[key] : undefined;
  }, []);

  const sortedRows = React.useMemo(() => {
    if (!sorting.id || !sorting.direction) return dataRows;
    const sortColumn = normalizedColumns.find((c) => c.id === sorting.id);
    if (!sortColumn) return dataRows;
    const sorted = [...dataRows];
    sorted.sort((a, b) => {
      const av = getCellValue(a.original, sortColumn);
      const bv = getCellValue(b.original, sortColumn);
      if (av == null && bv == null) return 0;
      if (av == null) return sorting.direction === "asc" ? -1 : 1;
      if (bv == null) return sorting.direction === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sorting.direction === "asc" ? av - bv : bv - av;
      }
      return sorting.direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [dataRows, normalizedColumns, sorting, getCellValue]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / Math.max(1, pagination.pageSize)));
  const currentPage = Math.min(pagination.pageIndex, pageCount - 1);

  React.useEffect(() => {
    if (currentPage !== pagination.pageIndex) {
      setPagination((prev) => ({ ...prev, pageIndex: currentPage }));
    }
  }, [currentPage, pagination.pageIndex]);

  const pageRows = React.useMemo(() => {
    if (!addPagination) return sortedRows;
    const start = currentPage * pagination.pageSize;
    return sortedRows.slice(start, start + pagination.pageSize);
  }, [addPagination, sortedRows, currentPage, pagination.pageSize]);

  const toggleSort = React.useCallback((columnId) => {
    setSorting((prev) => {
      if (prev.id !== columnId) return { id: columnId, direction: "asc" };
      if (prev.direction === "asc") return { id: columnId, direction: "desc" };
      if (prev.direction === "desc") return { id: null, direction: null };
      return { id: columnId, direction: "asc" };
    });
  }, []);

  const selectionColumn = React.useMemo(
    () => ({
      id: "__select",
      header: () => {
        const selectedCount = pageRows.filter((r) => rowSelection[r.id]).length;
        const allSelected = pageRows.length > 0 && selectedCount === pageRows.length;
        const someSelected = selectedCount > 0 && !allSelected;
        return (
        <div className="flex w-full justify-center">
          <Checkbox
            checked={
              allSelected ||
              (someSelected && "indeterminate")
            }
            onCheckedChange={(value) => {
              const checked = !!value;
              setRowSelection((prev) => {
                const next = { ...(prev ?? {}) };
                pageRows.forEach((row) => {
                  if (checked) next[row.id] = true;
                  else delete next[row.id];
                });
                return next;
              });
            }}
            aria-label="Select all"
          />
        </div>
      );
      },
      cell: ({ row }) => (
        <div className="flex w-full justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={Boolean(rowSelection[row.id])}
            onCheckedChange={(value) => {
              const checked = !!value;
              setRowSelection((prev) => {
                const next = { ...(prev ?? {}) };
                if (checked) next[row.id] = true;
                else delete next[row.id];
                return next;
              });
            }}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [pageRows, rowSelection, setRowSelection]
  );

  const actionsColumn = React.useMemo(
    () =>
      renderRowActions
        ? {
          id: "__actions",
          header: () => null,
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40"
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                {renderRowActions(row)}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        }
        : null,
    [renderRowActions]
  );

  const allColumns = React.useMemo(() => {
    const normalizeColumn = (column) => {
      if (!column || typeof column !== "object") return column;
      if (column.id === "__select" || column.id === "__actions") {
        return { ...column, enableColumnFilter: false, enableSorting: false };
      }
      if (column.filter === false) {
        return { ...column, enableSorting: false };
      }
      return column;
    };

    const mergedColumns = enableSelection
      ? (actionsColumn
        ? [selectionColumn, ...normalizedColumns, actionsColumn]
        : [selectionColumn, ...normalizedColumns])
      : (actionsColumn ? [...normalizedColumns, actionsColumn] : normalizedColumns);

    return mergedColumns.map(normalizeColumn);
  }, [selectionColumn, normalizedColumns, actionsColumn, enableSelection]);

  React.useEffect(() => {
    const cb = onSelectionChangeRef.current;
    if (cb && enableSelection) {
      const selected = dataRows
        .filter((r) => rowSelection[r.id])
        .map((r) => r.original);
      cb(selected);
    }
  }, [rowSelection, enableSelection, dataRows]);

  const visibleColumns = React.useMemo(
    () =>
      allColumns.filter((column) => {
        if (column.id === "__select" || column.id === "__actions") return true;
        return columnVisibility[column.id] !== false;
      }),
    [allColumns, columnVisibility]
  );

  const hideableColumns = React.useMemo(
    () =>
      allColumns.filter(
        (column) =>
          column.id !== "__select" &&
          column.id !== "__actions" &&
          column.enableHiding !== false
      ),
    [allColumns]
  );

  const getSortIcon = React.useCallback(
    (columnId) => {
      if (sorting.id !== columnId || !sorting.direction) return ArrowUpDown;
      return sorting.direction === "asc" ? ArrowUp : ArrowDown;
    },
    [sorting]
  );

  const renderCell = React.useCallback(
    (column, row) => {
      const value = getCellValue(row.original, column);
      if (typeof column.cell === "function") {
        return column.cell({
          row: {
            id: row.id,
            index: row.index,
            original: row.original,
            getIsSelected: () => Boolean(rowSelection[row.id]),
            toggleSelected: (value) =>
              setRowSelection((prev) => {
                const next = { ...(prev ?? {}) };
                const checked = value ?? !next[row.id];
                if (checked) next[row.id] = true;
                else delete next[row.id];
                return next;
              }),
          },
          column,
          getValue: () => value,
        });
      }
      if (typeof column.render === "function") return column.render(row.original);
      return value ?? "—";
    },
    [getCellValue, rowSelection, setRowSelection]
  );

  const getPaginationRange = () => {
    const total = pageCount;
    const current = currentPage;

    const delta = 1; // how many pages beside current
    const range = [];

    const left = Math.max(0, current - delta);
    const right = Math.min(total - 1, current + delta);

    // Always include first page
    if (left > 0) {
      range.push(0);
      if (left > 1) range.push("...");
    }

    // Middle pages
    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    // Always include last page
    if (right < total - 1) {
      if (right < total - 2) range.push("...");
      range.push(total - 1);
    }

    return range;
  };

  return (
    <div className="space-y-3 w-full flex flex-col">
      <div
        className={cn(
          containerClassName,
          "flex flex-col overflow-hidden rounded-md border border-gray-200 bg-background",
          fixedHeight && "h-[500px]",
        )}
      >
        <div className={cn(fixedHeight ? "flex-1 overflow-y-auto" : "overflow-y-visible")}>
          <Table className="relative min-w-full text-black" stickyHeader>
            <TableHeader className="text-black shadow-sm">
              <TableRow className="">
                {visibleColumns.map((column, columnIndex) => {
                  const isSelection = column.id === "__select";
                  const headerFilterEnabled = column.filter !== false && column.enableSorting !== false;
                  const title =
                    (column.meta && column.meta.label) ||
                    column.header ||
                    column.id;
                  const SortIcon = getSortIcon(column.id);

                  const headerInner = isSelection ? (
                    <div className="flex justify-center">{selectionColumn.header?.()}</div>
                  ) : (
                    <div className="">
                      {headerFilterEnabled ? (
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            if (event.button === 2) return;
                            toggleSort(column.id);
                          }}
                          className="flex w-full items-center gap-3 text-center text-sm font-semibold text-gray-800 hover:text-black"
                        >
                          <span className="truncate text-center">{String(title)}</span>
                          <SortIcon className="h-4 w-4 shrink-0" />
                        </button>
                      ) : (
                        <span className="truncate text-sm font-semibold text-gray-800">
                          {String(title)}
                        </span>
                      )}
                    </div>
                  );

                  const headerCell = (
                    <TableHead
                      className={
                        columnIndex === 0
                          ? "sticky top-0 left-0 z-20 bg-background px-4 py-3 text-sm text-black border-b border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                          : "sticky top-0 z-20 bg-background px-4 py-3 text-sm text-black border-b border-gray-200"
                      }
                    >
                      {headerInner}
                    </TableHead>
                  );

                  return enableHeaderContextMenu ? (
                      <ContextMenu key={column.id}>
                        <ContextMenuTrigger asChild>
                          {headerCell}
                        </ContextMenuTrigger>
                        <ContextMenuContent align="start">
                          {hideableColumns.map((column) => (
                            <ContextMenuCheckboxItem
                              key={column.id}
                              checked={columnVisibility[column.id] !== false}
                              onCheckedChange={(value) =>
                                setColumnVisibility((prev) => ({
                                  ...prev,
                                  [column.id]: !!value,
                                }))
                              }
                            >
                              {String(
                                (column.meta &&
                                  column.meta.label) ||
                                column.header ||
                                column.id
                              )}
                            </ContextMenuCheckboxItem>
                          ))}
                        </ContextMenuContent>
                      </ContextMenu>
                    ) : (
                      <React.Fragment key={column.id}>{headerCell}</React.Fragment>
                    );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTableLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="h-24 text-sm text-muted-foreground"
                  >
                    <div className="flex justify-center">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : queryError ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="h-24 text-sm text-destructive"
                  >
                    {queryError?.message ?? "Failed to load data."}
                  </TableCell>
                </TableRow>
              ) : pageRows.length ? (
                pageRows.map((row) => {
                  const rowApi = {
                    id: row.id,
                    index: row.index,
                    original: row.original,
                    getIsSelected: () => Boolean(rowSelection[row.id]),
                  };
                  const rowProps = typeof getRowProps === "function" ? getRowProps(rowApi) ?? {} : {};
                  const { className: rowClassName, ...restRowProps } = rowProps;
                  return (
                  <TableRow
                    key={row.id}
                    data-state={rowSelection[row.id] ? "selected" : undefined}
                    className={rowClassName ? `border-gray-200 px-4 ${rowClassName}` : "border-gray-200 px-4"}
                    {...restRowProps}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={`${row.id}-${column.id}`}
                        className={
                          column.id === "__select"
                            ? "text-center px-4 py-3 text-sm text-black cursor-pointer"
                            : "px-4 py-3 text-sm text-black"
                        }
                        onClick={
                          column.id === "__select"
                            ? () =>
                              setRowSelection((prev) => {
                                const next = { ...(prev ?? {}) };
                                if (next[row.id]) delete next[row.id];
                                else next[row.id] = true;
                                return next;
                              })
                            : undefined
                        }
                      >
                        {column.id === "__select"
                          ? selectionColumn.cell({ row: rowApi })
                          : renderCell(column, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="h-24 text-sm text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {(addPagination || enableSelection) && (
        <div className="mt-4 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {enableSelection && (
            <span className="flex-1 text-xs text-muted-foreground">
              {Object.keys(rowSelection ?? {}).length} of{" "}
              {pageRows.length} row(s) selected.
            </span>
          )}

          {addPagination && pageCount > 1 && (
            <div className="sm:ml-auto flex justify-end flex-1">
              <Pagination className="sm:ml-auto flex justify-end flex-1">
                <PaginationContent>
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) {
                          handlePaginationChange((prev) => ({
                            ...prev,
                            pageIndex: Math.max(0, prev.pageIndex - 1),
                          }));
                        }
                      }}
                      className={
                        currentPage <= 0
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {getPaginationRange().map((item, index) =>
                    item === "..." ? (
                      <PaginationItem key={`...-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePaginationChange((prev) => ({
                              ...prev,
                              pageIndex: item,
                            }));
                          }}
                        >
                          {item + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < pageCount - 1) {
                          handlePaginationChange((prev) => ({
                            ...prev,
                            pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
                          }));
                        }
                      }}
                      className={
                        currentPage >= pageCount - 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
