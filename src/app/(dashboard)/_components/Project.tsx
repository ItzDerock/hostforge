"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FaGear } from "react-icons/fa6";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

type Container = {
  id: string;
  name: string;
  friendlyName: string;
  status: "HEALTHY" | "STARTING" | "UNHEALTHY";
  type: string;
};

const columns: ColumnDef<Container>[] = [
  {
    accessorKey: "friendlyName",
    header: "Name",
  },

  {
    accessorKey: "type",
    header: "Type",
  },

  {
    accessorKey: "status",
    header: "Status",
  },

  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="float-right mr-0 h-8 w-8 p-0">
              <span className="sr-only">Actions</span>
              <FaGear />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>test</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function Project() {
  const table = useReactTable({
    data: [
      {
        id: "1",
        name: "db",
        friendlyName: "Database",
        status: "HEALTHY",
        type: "DATABASE",
      },
      {
        id: "2",
        name: "plausible",
        friendlyName: "Plausible",
        status: "HEALTHY",
        type: "APP",
      },
      {
        id: "3",
        name: "clickhouse",
        friendlyName: "Clickhouse",
        status: "HEALTHY",
        type: "DATABASE",
      },
    ] as Container[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      {/* 
      Card header contains:
      - Project name
      - Project health
      - Basic project stats 
      */}
      <CardHeader className="flex flex-row flex-wrap justify-between">
        {/* Name and health */}
        <div>
          <CardTitle className="font-semibold">Plausible</CardTitle>
          <p className="mb-auto mt-0 text-sm text-muted-foreground">
            3/3 - Healthy
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-row gap-2 text-center">
          {/* CPU */}
          <div>
            <CardTitle>CPU</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>

          {/* Memory */}
          <div>
            <CardTitle>MEM</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>

          {/* Disk */}
          <div>
            <CardTitle>DISK</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
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
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  <p className="text-muted-foreground">No services found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
