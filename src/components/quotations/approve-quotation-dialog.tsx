import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { projectService } from '@/services/projectService';
import { quotationService } from '@/services/quotationService';
import type { Quotation, QuotationItem } from '@/types/domain';

interface Props {
  quotation: Quotation | null;
  items: QuotationItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectStarted: () => void;
}

export function ApproveQuotationDialog({
  quotation,
  items,
  isOpen,
  onOpenChange,
  onProjectStarted,
}: Props) {
  const { profile } = useAuth();
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset cost inputs when dialog opens with new quotation
  useEffect(() => {
    if (isOpen && items.length > 0) {
      const initial: Record<string, string> = {};
      items.forEach((item) => {
        initial[item.id] = '';
      });
      setCostInputs(initial);
    }
  }, [isOpen, items]);

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const cost = parseFloat(costInputs[item.id] ?? '0') || 0;
      return sum + cost * item.quantity;
    }, 0);
  }, [costInputs, items]);

  const profitAmount = (quotation?.total ?? 0) - totalCost;
  const profitPercentage =
    (quotation?.total ?? 0) > 0 ? (profitAmount / (quotation?.total ?? 1)) * 100 : 0;

  const formatPKR = (val: number) =>
    `Rs. ${val.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleStartProject = async () => {
    if (!quotation || !profile) return;

    const allFilled = items.every((item) => {
      const raw = costInputs[item.id] ?? '';
      return raw.trim() !== '' && !isNaN(parseFloat(raw));
    });

    if (!allFilled) {
      toast.error('Please enter the cost for every line item.');
      return;
    }

    setIsSubmitting(true);
    try {
      await projectService.createProject({
        companyId: quotation.companyId,
        quotationId: quotation.id,
        estId: quotation.estId,
        customerName: quotation.customerName,
        customerAddress: quotation.customerAddress,
        quoteTotal: quotation.total,
        totalCost,
        createdBy: profile.id,
        items: items.map((item) => {
          const costPerUnit = parseFloat(costInputs[item.id] ?? '0') || 0;
          return {
            slNo: item.slNo,
            description: item.description,
            quantity: item.quantity,
            salePrice: item.unitPrice,
            costPrice: costPerUnit,
            saleAmount: item.amount,
            costAmount: costPerUnit * item.quantity,
          };
        }),
      });

      await quotationService.approveQuotation(quotation.id);

      toast.success('Project started successfully.');
      onOpenChange(false);
      onProjectStarted();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to start project.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quotation) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Approve Quotation — {quotation.estId}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enter the cost price for each line item. The system will calculate profit
            automatically.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Items table with cost inputs */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold">Sl.</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold">Description</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold">Qty</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold">Sale Price</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold">Sale Amount</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold">
                    Cost / Unit
                    <span className="ml-1 text-amber-300">*</span>
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold">Cost Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const costPerUnit = parseFloat(costInputs[item.id] ?? '0') || 0;
                  const costAmount = costPerUnit * item.quantity;
                  return (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? 'bg-green-50/40' : 'bg-white'}
                    >
                      <td className="px-3 py-2.5 text-slate-500">{item.slNo}</td>
                      <td className="px-3 py-2.5 leading-snug text-slate-700">
                        {item.description}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {formatPKR(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                        {formatPKR(item.amount)}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <Input
                          className="h-8 w-32 text-right text-sm"
                          min="0"
                          onChange={(e) =>
                            setCostInputs((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={costInputs[item.id] ?? ''}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {formatPKR(costAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Profit summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Quote Total</span>
                <span className="font-medium">{formatPKR(quotation.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total Cost</span>
                <span className="font-medium">{formatPKR(totalCost)}</span>
              </div>
              <div
                className={`flex justify-between border-t pt-2 text-sm font-semibold ${
                  profitAmount >= 0 ? 'text-green-700' : 'text-red-600'
                }`}
              >
                <span>Profit</span>
                <span>{formatPKR(profitAmount)}</span>
              </div>
              <div
                className={`flex justify-between text-xs font-medium ${
                  profitPercentage >= 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                <span>Profit %</span>
                <span>{profitPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
              onClick={() => void handleStartProject()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Starting project...
                </>
              ) : (
                'Start Project'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
