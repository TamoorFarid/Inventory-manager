import { useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useFieldArray, useForm } from 'react-hook-form';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDate } from '@/lib/utils';
import { siteContentService } from '@/services/siteContentService';
import type { SiteQuotation } from '@/types/domain';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().refine((v) => Number(v) > 0, { message: 'Must be > 0' }),
  unitPrice: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, { message: 'Must be ≥ 0' }),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  customerAddress: z.string().optional(),
  quoteDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  isPublished: z.boolean(),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  title: '',
  customerAddress: '',
  quoteDate: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
  isPublished: true,
  items: [{ description: '', quantity: '1', unitPrice: '0' }],
};

export function SiteQuotationsTab() {
  const { profile } = useAuth();
  const [quotations, setQuotations] = useState<SiteQuotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<SiteQuotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<SiteQuotation | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const watchItems = form.watch('items');

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      setQuotations(await siteContentService.listSiteQuotations());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load quotations.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  const openCreate = () => {
    setEditingQuotation(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (quotation: SiteQuotation) => {
    setEditingQuotation(quotation);
    form.reset({
      title: quotation.title,
      customerAddress: quotation.customerAddress ?? '',
      quoteDate: quotation.quoteDate,
      notes: quotation.notes ?? '',
      isPublished: quotation.isPublished,
      items:
        quotation.items.length > 0
          ? quotation.items.map((item) => ({
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice),
            }))
          : defaultValues.items,
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setDialogOpen(false);
    setEditingQuotation(null);
    form.reset(defaultValues);
  };

  const onSubmit = async (values: FormValues) => {
    if (!profile) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        customerAddress: values.customerAddress,
        quoteDate: values.quoteDate,
        notes: values.notes,
        isPublished: values.isPublished,
        items: values.items.map((item, index) => ({
          slNo: index + 1,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };

      if (editingQuotation) {
        await siteContentService.updateSiteQuotation(editingQuotation.id, payload, profile.id);
        toast.success('Quotation updated.');
      } else {
        await siteContentService.createSiteQuotation(payload, profile.id);
        toast.success('Quotation created.');
      }

      handleClose();
      await loadQuotations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save quotation.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!quotationToDelete || !profile) return;
    try {
      await siteContentService.deleteSiteQuotation(quotationToDelete.id, profile.id);
      toast.success('Quotation deleted.');
      setQuotationToDelete(null);
      await loadQuotations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete quotation.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Showcase quotations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sample quotes visitors can view as a PDF and message you about on the SunPulse website.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New quotation
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No quotations yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create a sample quote to showcase pricing on the public site.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quotations.map((quotation) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={quotation.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{quotation.title}</p>
                      <p className="text-xs font-medium text-green-700">{quotation.quoteNumber}</p>
                    </div>
                    {quotation.isPublished ? (
                      <Badge className="shrink-0" variant="success">Published</Badge>
                    ) : (
                      <Badge className="shrink-0" variant="outline">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(quotation.quoteDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {quotation.items.length} line item{quotation.items.length === 1 ? '' : 's'}
                  </p>
                  <p className="mt-3 text-lg font-bold text-slate-900">{formatCurrency(quotation.total)}</p>
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1" onClick={() => openEdit(quotation)} size="sm" variant="outline">
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button onClick={() => setQuotationToDelete(quotation)} size="sm" variant="ghost">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={(open) => (open ? setDialogOpen(true) : handleClose())} open={dialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuotation ? `Edit ${editingQuotation.quoteNumber}` : 'New quotation'}</DialogTitle>
            <DialogDescription>
              Shown on the public site with a downloadable, on-brand PDF.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="quote-title">Title</Label>
              <Input
                id="quote-title"
                placeholder="6kW Residential Hybrid Package"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-date">Quote date</Label>
              <Input id="quote-date" type="date" {...form.register('quoteDate')} />
              {form.formState.errors.quoteDate && (
                <p className="text-xs text-destructive">{form.formState.errors.quoteDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-address">Location (optional)</Label>
              <Textarea id="quote-address" placeholder="Lahore, Pakistan" {...form.register('customerAddress')} />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Line items</h3>
              <div className="grid grid-cols-[1fr_70px_110px_100px_28px] gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              {fields.map((field, index) => {
                const item = watchItems[index];
                const amount = (parseFloat(item?.quantity ?? '0') || 0) * (parseFloat(item?.unitPrice ?? '0') || 0);

                return (
                  <div className="grid grid-cols-[1fr_70px_110px_100px_28px] items-start gap-2" key={field.id}>
                    <Input placeholder="Solar panel 550W" {...form.register(`items.${index}.description`)} />
                    <Input min="0" step="any" type="number" {...form.register(`items.${index}.quantity`)} />
                    <Input min="0" step="any" type="number" {...form.register(`items.${index}.unitPrice`)} />
                    <div className="flex h-9 items-center justify-end text-sm font-medium tabular-nums text-slate-700">
                      {amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <button
                      className="mt-1.5 flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}

              {form.formState.errors.items?.root && (
                <p className="text-xs text-destructive">{form.formState.errors.items.root.message}</p>
              )}

              <Button
                className="w-full"
                onClick={() => append({ description: '', quantity: '1', unitPrice: '0' })}
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Add line item
              </Button>
            </div>

            <div className="flex justify-end border-t pt-4">
              <div className="w-56 space-y-2">
                <div className="flex justify-between border-t-2 border-green-600 pt-2 text-base font-bold text-green-700">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-notes">Notes (optional)</Label>
              <Textarea
                id="quote-notes"
                placeholder="Any extra context shown on the PDF"
                {...form.register('notes')}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Published</p>
                <p className="text-xs text-muted-foreground">Visible on the public site</p>
              </div>
              <Switch
                checked={form.watch('isPublished')}
                onCheckedChange={(checked) => form.setValue('isPublished', checked)}
              />
            </div>

            <DialogFooter>
              <Button onClick={handleClose} type="button" variant="ghost">
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Saving...' : editingQuotation ? 'Save changes' : 'Create quotation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setQuotationToDelete(null)} open={Boolean(quotationToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{quotationToDelete?.title}</span> will be
              removed from the public site. This performs a soft delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete quotation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
