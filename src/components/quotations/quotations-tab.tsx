import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { QuotationDetailDialog } from '@/components/quotations/quotation-detail-dialog';
import { QuotationFormDialog } from '@/components/quotations/quotation-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingTable } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/errors';
import { quotationService } from '@/services/quotationService';
import type { Quotation } from '@/types/domain';

interface Props {
  companyId: string;
  canCreate?: boolean;
}

export function QuotationsTab({ companyId, canCreate = false }: Props) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await quotationService.listQuotations(companyId);
      setQuotations(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load quotations.'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Quotations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Generate and manage customer estimates for this company.
            </p>
          </div>
          {canCreate ? (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="size-4" />
              New Quotation
            </Button>
          ) : null}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <LoadingTable />
          ) : quotations.length === 0 ? (
            <EmptyState
              actionLabel={canCreate ? 'New Quotation' : undefined}
              description="Create your first customer estimate."
              icon={FileText}
              onAction={canCreate ? () => setFormOpen(true) : undefined}
              title="No quotations yet"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      EST ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q, index) => (
                    <tr
                      key={q.id}
                      className={
                        index % 2 === 0
                          ? 'border-b border-slate-100 bg-white'
                          : 'border-b border-slate-100 bg-slate-50/50'
                      }
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-700">{q.estId}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{q.customerName}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {format(new Date(q.quoteDate), 'dd MMM, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        Rs.{' '}
                        {q.total.toLocaleString('en', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={() => setDetailQuotation(q)}
                          size="sm"
                          variant="outline"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <QuotationFormDialog
        companyId={companyId}
        isOpen={formOpen}
        onCreated={() => void loadQuotations()}
        onOpenChange={setFormOpen}
      />

      <QuotationDetailDialog
        isOpen={Boolean(detailQuotation)}
        onOpenChange={(open) => !open && setDetailQuotation(null)}
        quotation={detailQuotation}
      />
    </>
  );
}
