import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FieldHint, FormInput, FormTextarea } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { companySchema, type CompanyValues } from '@/lib/validators';

interface CompanyFormDialogProps {
  initialValues?: CompanyValues;
  isOpen: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CompanyValues) => Promise<void> | void;
}

const defaultValues: CompanyValues = {
  name: '',
  description: '',
};

export function CompanyFormDialog({
  initialValues = defaultValues,
  isOpen,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CompanyFormDialogProps) {
  const form = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
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
            {initialValues.name ? 'Update company' : 'Create company'}
          </DialogTitle>
          <DialogDescription>
            Define a new company workspace with scoped inventory, members, and sales.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <FormInput
            error={form.formState.errors.name}
            label="Company name"
            name="name"
            placeholder="Solar Retail"
            register={form.register}
          />

          <FormTextarea
            error={form.formState.errors.description}
            label="Description"
            name="description"
            placeholder="Short overview of this company’s operations"
            register={form.register}
          />
          <FieldHint>
            This description appears in company cards and detail pages.
          </FieldHint>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Saving...' : initialValues.name ? 'Save changes' : 'Create company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
