import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormInput, FormTextarea } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { inventorySchema, type InventoryValues } from '@/lib/validators';

interface InventoryFormDialogProps {
  initialValues?: InventoryValues;
  isOpen: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InventoryValues) => Promise<void> | void;
}

const defaultValues: InventoryValues = {
  title: '',
  description: '',
  kwPv: '',
  ipRating: '',
  warranty: '',
  maxSellingPrice: 0,
  minSellingPrice: 0,
  quantity: 0,
};

export function InventoryFormDialog({
  initialValues = defaultValues,
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: InventoryFormDialogProps) {
  const form = useForm<
    z.input<typeof inventorySchema>,
    unknown,
    InventoryValues
  >({
    resolver: zodResolver(inventorySchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues, isOpen]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialValues.title ? 'Update inventory item' : 'Create inventory item'}
          </DialogTitle>
          <DialogDescription>
            Track price guardrails, stock quantity, and update ownership.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <FormInput
            error={form.formState.errors.title}
            label="Title"
            name="title"
            placeholder="Pulse Charger"
            register={form.register}
          />
          <FormTextarea
            error={form.formState.errors.description}
            label="Description"
            name="description"
            placeholder="Optional details about the product"
            register={form.register}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              error={form.formState.errors.kwPv}
              label="KW/PV"
              name="kwPv"
              placeholder="5kW / 400W"
              register={form.register}
            />
            <FormInput
              error={form.formState.errors.ipRating}
              label="IP Rating"
              name="ipRating"
              placeholder="IP65"
              register={form.register}
            />
          </div>
          <FormInput
            error={form.formState.errors.warranty}
            label="Warranty"
            name="warranty"
            placeholder="5 years"
            register={form.register}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              error={form.formState.errors.minSellingPrice}
              label="Installer price"
              name="minSellingPrice"
              placeholder="25"
              register={form.register}
              type="number"
            />
            <FormInput
              error={form.formState.errors.maxSellingPrice}
              label="End user price"
              name="maxSellingPrice"
              placeholder="60"
              register={form.register}
              type="number"
            />
          </div>
          <FormInput
            error={form.formState.errors.quantity}
            label="Quantity"
            name="quantity"
            placeholder="100"
            register={form.register}
            type="number"
          />

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Saving...' : initialValues.title ? 'Save changes' : 'Create item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
