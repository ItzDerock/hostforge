/**
 * Reduces repetitiveness for `@tanstack/react-table` hooks.
 * An abstraction on top of an abstraction lol.
 */

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
} from "@tanstack/react-table";
import { type ReactNode } from "react";
import {
  TableCell,
  TableHead,
  TableRow,
  Table as UITable,
  TableBody as UITableBody,
  TableHeader as UITableHeader,
} from "~/components/ui/table";

/**
 * Takes care of ensuring correct types between the data and columns.
 *
 * @param data The data to use
 * @param columns The columns to use
 * @returns A `Table` instance
 */
export function useSimpleTable<T>({
  data,
  columns,
}: {
  data: T[];
  columns: ColumnDef<T>[];
}) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}

/**
 * Renders the table header
 */
export function TableHeader<T>({ table }: { table: Table<T> }) {
  return (
    <UITableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </UITableHeader>
  );
}

/**
 * Takes care of rendering table body
 * The generic is required because without it,
 * there's a type error where Table<Something>
 * cannot be assigned to Table<unknown> which is weird
 */
export function TableBody<T>({
  table,
  empty,
}: {
  table: Table<T>;
  empty?: ReactNode | string;
}) {
  return (
    <UITableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell
            colSpan={table.getAllColumns().length}
            className="text-center"
          >
            {typeof empty === "string" || typeof empty === "undefined" ? (
              <p className="text-muted-foreground">{empty ?? "Empty Table"}</p>
            ) : (
              empty
            )}
          </TableCell>
        </TableRow>
      )}
    </UITableBody>
  );
}

export function SimpleTable<T>({
  table,
  empty,
}: {
  table: Table<T>;
  empty?: ReactNode | string;
}) {
  return (
    <UITable>
      <TableHeader table={table} />
      <TableBody table={table} empty={empty} />
    </UITable>
  );
}
