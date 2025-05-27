'use client';

import { DataTable } from './data-table';
import { ColumnDef } from "@tanstack/react-table";

interface ClientDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ClientDataTable<TData, TValue>({
  columns,
  data,
}: ClientDataTableProps<TData, TValue>) {
  return (
    <DataTable columns={columns} data={data} />
  );
}