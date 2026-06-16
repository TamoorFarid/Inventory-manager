import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { QuotePDFTemplate } from '@/components/quotations/quote-pdf-template';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/errors';
import { quotationService } from '@/services/quotationService';
import type { Quotation, QuotationItem } from '@/types/domain';

// ── Schema ──────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().refine((v) => Number(v) > 0, { message: 'Must be > 0' }),
  unitPrice: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, { message: 'Must be ≥ 0' }),
});

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().min(1, 'Customer address is required'),
  quoteDate: z.string().min(1, 'Date is required'),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});

type FormValues = z.infer<typeof formSchema>;

// ── PDF generation utility ───────────────────────────────────────────────────

async function downloadQuotePDF(quote: Quotation, items: QuotationItem[]) {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;background:white;z-index:-1;';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<QuotePDFTemplate items={items} quote={quote} />);

  await new Promise((resolve) => setTimeout(resolve, 600));

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
    });

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth();
    const pH = pdf.internal.pageSize.getHeight();

    const pxPerMM = canvas.width / pW;
    const idealPageHPx = pH * pxPerMM;

    const ctx = canvas.getContext('2d')!;
    function findSafeCutY(idealY: number): number {
      const range = Math.round(idealPageHPx * 0.07);
      const lo = Math.max(0, Math.round(idealY) - range);
      const hi = Math.min(canvas.height - 1, Math.round(idealY) + Math.round(range * 0.25));
      let bestY = Math.round(idealY);
      let bestScore = -1;
      for (let y = lo; y <= hi; y++) {
        const d = ctx.getImageData(0, y, canvas.width, 1).data;
        let white = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) white++;
        }
        const score = white / canvas.width;
        if (score > bestScore) { bestScore = score; bestY = y; }
      }
      return bestY;
    }

    const pageStarts = [0];
    let nextIdeal = idealPageHPx;
    while (nextIdeal < canvas.height) {
      pageStarts.push(findSafeCutY(nextIdeal));
      nextIdeal = pageStarts[pageStarts.length - 1] + idealPageHPx;
    }

    const totalPages = pageStarts.length;
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const startPx = pageStarts[i];
      const endPx = i + 1 < totalPages ? pageStarts[i + 1] : canvas.height;
      const sliceH = endPx - startPx;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.round(idealPageHPx);
      const pCtx = pageCanvas.getContext('2d')!;
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pCtx.drawImage(canvas, 0, startPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pW, pH);

      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`Page ${i + 1} of ${totalPages}`, pW / 2, pH - 5, { align: 'center' });
    }

    pdf.save(`Estimate-${quote.estId}.pdf`);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  companyId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function QuotationFormDialog({ companyId, isOpen, onOpenChange, onCreated }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerAddress: '',
      quoteDate: format(new Date(), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: '1', unitPrice: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');

  const calcAmount = useCallback((index: number) => {
    const item = watchItems[index];
    if (!item) return 0;
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
  }, [watchItems]);

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );

  const handleClose = () => {
    if (isSubmitting) return;
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const itemsWithAmounts = values.items.map((item, i) => ({
        slNo: i + 1,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        amount: parseFloat(item.quantity) * parseFloat(item.unitPrice),
      }));

      const quotation = await quotationService.createQuotation({
        companyId,
        customerName: values.customerName,
        customerAddress: values.customerAddress,
        quoteDate: values.quoteDate,
        items: itemsWithAmounts,
      });

      const quotationItems: QuotationItem[] = itemsWithAmounts.map((item, i) => ({
        id: `temp-${i}`,
        quotationId: quotation.id,
        slNo: item.slNo,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      }));

      toast.success('Quotation saved. Generating PDF...');
      await downloadQuotePDF(quotation, quotationItems);
      toast.success('PDF downloaded successfully.');

      form.reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create quotation.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Quotation</DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* ── Header fields ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quoteDate">Date</Label>
              <Input id="quoteDate" type="date" {...form.register('quoteDate')} />
              {form.formState.errors.quoteDate && (
                <p className="text-xs text-destructive">{form.formState.errors.quoteDate.message}</p>
              )}
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="Muhammad Sarab"
                {...form.register('customerName')}
              />
              {form.formState.errors.customerName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerAddress">Customer Address</Label>
              <Textarea
                className="min-h-[80px] resize-none"
                id="customerAddress"
                placeholder={'Defense Road\nSialkot\nPakistan'}
                {...form.register('customerAddress')}
              />
              {form.formState.errors.customerAddress && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customerAddress.message}
                </p>
              )}
            </div>
          </div>

          {/* ── Line items ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Line Items</h3>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_120px_100px_28px] gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Description</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Unit Price (Rs.)</span>
              <span className="text-right">Amount (Rs.)</span>
              <span />
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_80px_120px_100px_28px] items-start gap-2"
              >
                <div>
                  <Textarea
                    className="min-h-[60px] resize-none text-sm"
                    placeholder="Product description..."
                    {...form.register(`items.${index}.description`)}
                  />
                  {form.formState.errors.items?.[index]?.description && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {form.formState.errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    className="text-center text-sm"
                    min="0"
                    placeholder="1"
                    step="any"
                    type="number"
                    {...form.register(`items.${index}.quantity`)}
                  />
                  {form.formState.errors.items?.[index]?.quantity && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {form.formState.errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    className="text-right text-sm"
                    min="0"
                    placeholder="0.00"
                    step="any"
                    type="number"
                    {...form.register(`items.${index}.unitPrice`)}
                  />
                  {form.formState.errors.items?.[index]?.unitPrice && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {form.formState.errors.items[index]?.unitPrice?.message}
                    </p>
                  )}
                </div>

                <div className="flex h-9 items-center justify-end">
                  <span className="text-sm font-medium tabular-nums text-slate-700">
                    {calcAmount(index).toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
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
            ))}

            {form.formState.errors.items?.root && (
              <p className="text-xs text-destructive">
                {form.formState.errors.items.root.message}
              </p>
            )}

            <Button
              className="w-full"
              onClick={() => append({ description: '', quantity: '1', unitPrice: '0' })}
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              Add Line Item
            </Button>
          </div>

          {/* ── Subtotal ── */}
          <div className="flex justify-end border-t pt-4">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Subtotal</span>
                <span>
                  Rs.{' '}
                  {subtotal.toLocaleString('en', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-green-600 pt-2 text-base font-bold text-green-700">
                <span>Total</span>
                <span>
                  Rs.{' '}
                  {subtotal.toLocaleString('en', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button disabled={isSubmitting} onClick={handleClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Quote'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
