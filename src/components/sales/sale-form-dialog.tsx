import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Search } from 'lucide-react';
import { z } from 'zod';

import { FieldHint, FormInput } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saleSchema, type SaleValues } from '@/lib/validators';
import { formatCurrency } from '@/lib/utils';
import type { InventoryItem } from '@/types/domain';

interface SaleFormDialogProps {
  inventoryItems: InventoryItem[];
  isOpen: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SaleValues) => Promise<void> | void;
}

const defaultValues: SaleValues = {
  inventoryItemId: '',
  customerName: '',
  quantitySold: 1,
  sellingPricePerUnit: 0,
};

export function SaleFormDialog({
  inventoryItems,
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SaleFormDialogProps) {
  const form = useForm<z.input<typeof saleSchema>, unknown, SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues,
  });

  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  const selectedItemId = useWatch({
    control: form.control,
    name: 'inventoryItemId',
  });
  const selectedItem = useMemo(
    () => inventoryItems.find((item) => item.id === selectedItemId) ?? null,
    [inventoryItems, selectedItemId],
  );

  const filteredInventoryItems = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) {
      return inventoryItems;
    }
    return inventoryItems.filter((item) => item.title.toLowerCase().includes(query));
  }, [inventoryItems, productSearch]);

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [form, isOpen]);

  useEffect(() => {
    if (isProductSelectOpen) {
      const timeout = setTimeout(() => productSearchInputRef.current?.focus(), 0);
      return () => clearTimeout(timeout);
    }
    setProductSearch('');
  }, [isProductSelectOpen]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    form.setValue('sellingPricePerUnit', selectedItem.minSellingPrice, {
      shouldValidate: true,
    });
  }, [form, selectedItem]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a sale</DialogTitle>
          <DialogDescription>
            This will create a sales record, reduce stock, and generate real-time notifications.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            if (selectedItem) {
              if (values.quantitySold > selectedItem.quantity) {
                form.setError('quantitySold', {
                  message: 'Quantity sold cannot exceed available inventory.',
                });
                return;
              }

              if (
                values.sellingPricePerUnit < selectedItem.minSellingPrice ||
                values.sellingPricePerUnit > selectedItem.maxSellingPrice
              ) {
                form.setError('sellingPricePerUnit', {
                  message: 'Selling price must stay within the allowed range.',
                });
                return;
              }
            }

            await onSubmit(values);
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Product</label>
            <Select
              onOpenChange={setIsProductSelectOpen}
              onValueChange={(value) =>
                form.setValue('inventoryItemId', value, { shouldValidate: true })
              }
              open={isProductSelectOpen}
              value={selectedItemId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inventory item" />
              </SelectTrigger>
              <SelectContent>
                <div
                  className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b border-border/70 bg-white p-1.5"
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-8 pl-7 text-sm"
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search product..."
                      ref={productSearchInputRef}
                      value={productSearch}
                    />
                  </div>
                </div>
                {filteredInventoryItems.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No products found.
                  </p>
                ) : (
                  filteredInventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.inventoryItemId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.inventoryItemId.message}
              </p>
            ) : null}
          </div>

          {selectedItem ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground">
              {selectedItem.quantity} units available.
              {' '}
              Allowed price range:
              {' '}
              {formatCurrency(selectedItem.minSellingPrice)} -{' '}
              {formatCurrency(selectedItem.maxSellingPrice)}
            </div>
          ) : null}

          <FormInput
            error={form.formState.errors.customerName}
            label="Customer name"
            name="customerName"
            placeholder="Jane Doe"
            register={form.register}
          />
          <FormInput
            error={form.formState.errors.quantitySold}
            label="Quantity sold"
            name="quantitySold"
            placeholder="1"
            register={form.register}
            type="number"
          />
          <FormInput
            error={form.formState.errors.sellingPricePerUnit}
            label="Selling price per unit"
            name="sellingPricePerUnit"
            placeholder="35"
            register={form.register}
            type="number"
          />
          <FieldHint>
            Server-side validation also protects inventory quantity and price boundaries.
          </FieldHint>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Recording...' : 'Record sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
