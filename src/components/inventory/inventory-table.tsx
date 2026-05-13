import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { InventoryItem } from '@/types/domain';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
}

export function InventoryTable({
  items,
  onDelete,
  onEdit,
}: InventoryTableProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/95 p-4 shadow-panel sm:p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center gap-2">
                Product
                <ArrowUpDown className="size-3.5" />
              </div>
            </TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price range</TableHead>
            <TableHead>Updated by</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {item.description || 'No description'}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-950">{item.quantity}</span>
                  {item.quantity <= LOW_STOCK_THRESHOLD ? (
                    <Badge variant="warning">Low</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {formatCurrency(item.minSellingPrice)} - {formatCurrency(item.maxSellingPrice)}
              </TableCell>
              <TableCell>
                {item.updatedByProfile?.username ?? item.createdByProfile?.username ?? 'system'}
              </TableCell>
              <TableCell>{formatRelativeTime(item.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button onClick={() => onEdit(item)} size="sm" variant="outline">
                    <Pencil className="size-4" />
                  </Button>
                  <Button onClick={() => onDelete(item)} size="sm" variant="ghost">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
