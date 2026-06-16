import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { QuotePDFTemplate } from '@/components/quotations/quote-pdf-template';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/errors';
import { quotationService } from '@/services/quotationService';
import type { Quotation, QuotationItem } from '@/types/domain';

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

    // Canvas pixels per mm
    const pxPerMM = canvas.width / pW;
    const idealPageHPx = pH * pxPerMM;

    // Find a whitespace row near each ideal page boundary to avoid cutting mid-content
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

    // Build page start positions using smart cut points
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

      // Render slice onto a full-page canvas (white background beneath)
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

interface Props {
  quotation: Quotation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuotationDetailDialog({ quotation, isOpen, onOpenChange }: Props) {
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!quotation || !isOpen) return;

    setIsLoadingItems(true);
    quotationService
      .getQuotationItems(quotation.id)
      .then(setItems)
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load items.')))
      .finally(() => setIsLoadingItems(false));
  }, [quotation, isOpen]);

  const handleDownload = async () => {
    if (!quotation) return;
    setIsDownloading(true);
    try {
      await downloadQuotePDF(quotation, items);
      toast.success('PDF downloaded.');
    } catch {
      toast.error('Failed to generate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatPKR = (val: number) =>
    `Rs. ${val.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!quotation) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quotation Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ── Meta info ── */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                EST ID
              </p>
              <p className="mt-1 font-bold text-green-700">{quotation.estId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Date</p>
              <p className="mt-1 font-medium text-slate-800">
                {format(new Date(quotation.quoteDate), 'dd MMM, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Customer
              </p>
              <p className="mt-1 font-medium text-slate-800">{quotation.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Address
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                {quotation.customerAddress}
              </p>
            </div>
          </div>

          {/* ── Items table ── */}
          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Line Items</h3>
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Sl.</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold">Description</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold">Qty</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold">Unit Price</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? 'bg-green-50/60' : 'bg-white'}
                      >
                        <td className="px-3 py-2.5 text-slate-500">{item.slNo}</td>
                        <td className="px-3 py-2.5 leading-snug text-slate-700">
                          {item.description}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-700">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700">
                          {formatPKR(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                          {formatPKR(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Totals ── */}
          <div className="flex justify-end">
            <div className="w-52 space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Subtotal</span>
                <span>{formatPKR(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-green-600 pt-2 text-base font-bold text-green-700">
                <span>Total</span>
                <span>{formatPKR(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={isDownloading || isLoadingItems}
              onClick={() => void handleDownload()}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
