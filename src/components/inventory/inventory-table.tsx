import { ArrowUpDown, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onMigrate: (item: InventoryItem) => void;
}

export function InventoryTable({ items, onDelete, onEdit, onMigrate }: InventoryTableProps) {
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
                {formatCurrency(item.minSellingPrice)} – {formatCurrency(item.maxSellingPrice)}
              </TableCell>
              <TableCell>
                {item.updatedByProfile?.username ?? item.createdByProfile?.username ?? 'system'}
              </TableCell>
              <TableCell>{formatRelativeTime(item.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMigrate(item)}>
                      <Share2 className="size-4" />
                      Migrate to company
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
