"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export type AdminTableCellValue = string | number;

export interface AdminTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface AdminTableCell {
  /** Plain value used for sorting and filtering — should match what `display` visually shows. */
  value: AdminTableCellValue;
  /** Optional richer JSX for display; falls back to `value` when omitted. */
  display?: ReactNode;
}

export interface AdminTableRow {
  key: string;
  cells: Record<string, AdminTableCell>;
}

interface AdminDataTableProps {
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  emptyMessage?: string;
}

type SortDirection = "asc" | "desc";

interface FilterClause {
  field: string;
  op: "=" | "!=";
  value: string;
}

// Splits on commas/newlines into clauses like `Tier = "Tier 1"` or `status != approved`,
// ANDed together. Unquoted values are kept as-is (so `Tier = Tier 1` also works).
function parseFilterClause(raw: string): FilterClause | null {
  const match = raw.trim().match(/^(.+?)\s*(!=|=)\s*(.+)$/);
  if (!match) return null;
  const [, field, op, rawValue] = match;
  const value = rawValue.trim().replace(/^["']|["']$/g, "").trim();
  if (!field.trim() || !value) return null;
  return { field: field.trim(), op: op as "=" | "!=", value };
}

export default function AdminDataTable({ columns, rows, emptyMessage = "No results." }: AdminDataTableProps) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [filterText, setFilterText] = useState("");

  const filterableColumns = columns.filter((c) => c.filterable !== false);

  const { filteredRows, unknownFields } = useMemo(() => {
    const clauses = filterText
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter(Boolean)
      .map(parseFilterClause);

    const unknownFields: string[] = [];
    const resolved = clauses.flatMap((clause) => {
      if (!clause) return [];
      const column = filterableColumns.find(
        (c) =>
          c.key.toLowerCase() === clause.field.toLowerCase() ||
          c.label.toLowerCase() === clause.field.toLowerCase(),
      );
      if (!column) {
        unknownFields.push(clause.field);
        return [];
      }
      return [{ column, op: clause.op, value: clause.value.toLowerCase() }];
    });

    if (resolved.length === 0) {
      return { filteredRows: rows, unknownFields };
    }

    const filteredRows = rows.filter((row) =>
      resolved.every(({ column, op, value }) => {
        const cell = String(row.cells[column.key]?.value ?? "").toLowerCase();
        return op === "=" ? cell === value : cell !== value;
      }),
    );

    return { filteredRows, unknownFields };
  }, [rows, filterText, filterableColumns]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const key = sort.key;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = a.cells[key]?.value ?? "";
      const bv = b.cells[key]?.value ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { sensitivity: "base", numeric: true }) * dir;
    });
  }, [filteredRows, sort]);

  function toggleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div>
      {filterableColumns.length > 0 && (
        <div className="admin-table-filter">
          <input
            type="text"
            className="form-input"
            placeholder={`Filter, e.g. ${filterableColumns[0].label} = "value", ${filterableColumns[filterableColumns.length - 1].label} != value`}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          {filterText && (
            <button type="button" className="admin-table-filter-clear" onClick={() => setFilterText("")}>
              Clear
            </button>
          )}
          {unknownFields.length > 0 && (
            <p className="admin-table-filter-hint">
              Unknown column{unknownFields.length > 1 ? "s" : ""}: {unknownFields.join(", ")}. Try:{" "}
              {filterableColumns.map((c) => c.label).join(", ")}.
            </p>
          )}
        </div>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const isSortable = column.sortable !== false;
                const isSorted = sort?.key === column.key;
                return (
                  <th key={column.key}>
                    {isSortable ? (
                      <button
                        type="button"
                        className="admin-table-sort-btn"
                        onClick={() => toggleSort(column.key)}
                      >
                        {column.label}
                        <span className="admin-table-sort-icon">
                          {isSorted ? (sort!.direction === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {rows.length === 0 ? emptyMessage : "No rows match that filter."}
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={row.key}>
                  {columns.map((column) => {
                    const cell = row.cells[column.key];
                    return <td key={column.key}>{cell?.display ?? cell?.value ?? ""}</td>;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
