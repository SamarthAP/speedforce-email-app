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
} from "../components/ui/table";
import he from "he";
import { isToday } from "../lib/date";
import { cn } from "../lib/utils";

export type EmailRow = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
};

export const defaultColumns: ColumnDef<EmailRow>[] = [
  {
    accessorKey: "from",
    header: "From",
    cell: ({ row }) => {
      const from = row.original.from;
      const formatted = from.slice(
        0,
        from.lastIndexOf("<") === -1 ? from.length : from.lastIndexOf("<")
      );

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => {
      const subject = row.original.subject;

      return (
        <div className="line-clamp-1">{subject.trim() || "(no subject)"}</div>
      );
    },
  },
  {
    accessorKey: "snippet",
    header: "Snippet",
    cell: ({ row }) => {
      const snippet = row.original.snippet;

      return (
        <div className="line-clamp-1 text-muted-foreground">
          {he
            .decode(snippet)
            .replace(/\u200C/g, "")
            .trim()}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.original.date);

      return (
        <div className="whitespace-nowrap text-muted-foreground text-right">
          {isToday(date)
            ? new Date(date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : new Date(date).toDateString()}
        </div>
      );
    },
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md overflow-hidden border select-none">
      <Table>
        {/* added sticky top-0 bg-secondary for body scroll */}
        <TableHeader className="sticky top-0 bg-secondary text-xs">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
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
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell key={cell.id} className="text-xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-xs"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
