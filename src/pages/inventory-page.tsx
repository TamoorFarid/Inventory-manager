import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, PackageSearch, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { InventoryCards } from '@/components/inventory/inventory-cards';
import { InventoryFormDialog } from '@/components/inventory/inventory-form-dialog';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingGrid } from '@/components/shared/loading-state';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/utils';
import { companyService } from '@/services/companyService';
import { inventoryService } from '@/services/inventoryService';
import { useAppStore } from '@/store/app-store';
import type { Company, InventoryFilters, InventoryItem } from '@/types/domain';

const baseFilters: InventoryFilters = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: '',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
  stockFilter: 'all',
  view: 'table',
};

export default function InventoryPage() {
  const { companyId } = useParams();
  const { profile } = useAuth();
  const { inventoryView, setInventoryView } = useAppStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    ...baseFilters,
    view: inventoryView,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const loadPage = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setIsLoading(true);

    try {
      const [nextCompany, nextItems] = await Promise.all([
        companyService.getCompanyById(companyId),
        inventoryService.listInventoryItems(companyId),
      ]);
      setCompany(nextCompany);
      setItems(nextItems);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load inventory.'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const analytics = useMemo(() => inventoryService.buildInventoryAnalytics(items), [items]);

  const filteredResult = useMemo(
    () => inventoryService.applyInventoryFilters(items, { ...filters, view: inventoryView }),
    [filters, inventoryView, items],
  );

  const handleSubmit = async (values: {
    title: string;
    description?: string;
    maxSellingPrice: number;
    minSellingPrice: number;
    quantity: number;
  }) => {
    if (!companyId || !profile) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem.id, values, profile.id);
        toast.success('Inventory item updated.');
      } else {
        await inventoryService.createInventoryItem(companyId, values, profile.id);
        toast.success('Inventory item created.');
      }

      setDialogOpen(false);
      setEditingItem(null);
      await loadPage();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save inventory item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !profile) {
      return;
    }

    const previousItems = items;
    setItems((current) => current.filter((item) => item.id !== itemToDelete.id));

    try {
      await inventoryService.deleteInventoryItem(itemToDelete.id, profile.id);
      toast.success('Inventory item deleted.');
      setItemToDelete(null);
      await loadPage();
    } catch (error) {
      setItems(previousItems);
      toast.error(getErrorMessage(error, 'Unable to delete inventory item.'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Search, sort, and manage stock inside ${company?.name ?? 'this company'} with clear update ownership and low-stock visibility.`}
        eyebrow="Inventory"
        title={company?.name ?? 'Inventory'}
        action={
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setEditingItem(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper="Total distinct products in this company."
          icon={PackageSearch}
          title="Products"
          value={analytics.totalProducts}
        />
        <MetricCard
          accent="from-chart-2/15 via-white to-chart-2/5"
          helper="Total units currently available in stock."
          icon={List}
          title="Total stock"
          value={analytics.totalStock}
        />
        <MetricCard
          accent="from-chart-4/15 via-white to-chart-4/5"
          helper="Products below the low-stock threshold."
          icon={LayoutGrid}
          title="Low stock items"
          value={analytics.lowStockItems}
        />
        <MetricCard
          accent="from-chart-3/15 via-white to-chart-3/5"
          helper="Estimated maximum stock value based on listed prices."
          icon={Plus}
          title="Estimated value"
          value={formatCurrency(analytics.estimatedStockValue)}
        />
      </div>

      <div className="rounded-[1.75rem] border border-white/70 bg-white/95 p-5 shadow-panel">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
          <Input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                search: event.target.value,
              }))
            }
            placeholder="Search title or description"
            value={filters.search}
          />
          <Select
            onValueChange={(value: InventoryFilters['stockFilter']) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                stockFilter: value,
              }))
            }
            value={filters.stockFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
              <SelectItem value="in-stock">In stock</SelectItem>
              <SelectItem value="out-of-stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value: `${InventoryFilters['sortBy']}:${InventoryFilters['sortDirection']}`) => {
              const [sortBy, sortDirection] = value.split(':') as [
                InventoryFilters['sortBy'],
                InventoryFilters['sortDirection'],
              ];

              setFilters((current) => ({
                ...current,
                sortBy,
                sortDirection,
              }));
            }}
            value={`${filters.sortBy}:${filters.sortDirection}`}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort inventory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt:desc">Newest updates</SelectItem>
              <SelectItem value="createdAt:desc">Newest created</SelectItem>
              <SelectItem value="title:asc">Title A-Z</SelectItem>
              <SelectItem value="quantity:asc">Lowest quantity</SelectItem>
              <SelectItem value="quantity:desc">Highest quantity</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setInventoryView('table');
                setFilters((current) => ({ ...current, view: 'table' }));
              }}
              variant={inventoryView === 'table' ? 'default' : 'outline'}
            >
              <List className="size-4" />
            </Button>
            <Button
              onClick={() => {
                setInventoryView('cards');
                setFilters((current) => ({ ...current, view: 'cards' }));
              }}
              variant={inventoryView === 'cards' ? 'default' : 'outline'}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredResult.total === 0 ? (
        <EmptyState
          actionLabel="Add inventory item"
          description="Create your first product or adjust your filters to see matching stock."
          icon={PackageSearch}
          onAction={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          title="No inventory items match this view"
        />
      ) : inventoryView === 'cards' ? (
        <InventoryCards
          items={filteredResult.items}
          onDelete={setItemToDelete}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
        />
      ) : (
        <InventoryTable
          items={filteredResult.items}
          onDelete={setItemToDelete}
          onEdit={(item) => {
            setEditingItem(item);
            setDialogOpen(true);
          }}
        />
      )}

      <Pagination
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        page={filteredResult.page}
        totalPages={filteredResult.totalPages}
      />

      <InventoryFormDialog
        initialValues={
          editingItem
            ? {
                title: editingItem.title,
                description: editingItem.description ?? '',
                maxSellingPrice: editingItem.maxSellingPrice,
                minSellingPrice: editingItem.minSellingPrice,
                quantity: editingItem.quantity,
              }
            : undefined
        }
        isOpen={dialogOpen}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)} open={Boolean(itemToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inventory item?</AlertDialogTitle>
            <AlertDialogDescription>
              This performs a soft delete and stores who removed the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
