import { MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { InventoryItem } from '@/types/domain';

interface InventoryCardsProps {
  items: InventoryItem[];
  onDelete: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onMigrate: (item: InventoryItem) => void;
}

export function InventoryCards({ items, onDelete, onEdit, onMigrate }: InventoryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const isLowStock = item.quantity <= LOW_STOCK_THRESHOLD;

        return (
          <Card key={item.id}>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {item.description || 'No description'}
                  </p>
                </div>
                <Badge variant={isLowStock ? 'warning' : 'success'}>
                  {isLowStock ? 'Low stock' : 'Healthy stock'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Quantity
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold text-slate-950">
                    {item.quantity}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Price range
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatCurrency(item.minSellingPrice)} – {formatCurrency(item.maxSellingPrice)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated {formatRelativeTime(item.updatedAt)} by{' '}
                {item.updatedByProfile?.username ?? item.createdByProfile?.username ?? 'system'}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <Button onClick={() => onEdit(item)} variant="outline">
                <Pencil className="size-4" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
