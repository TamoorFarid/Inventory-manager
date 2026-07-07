import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, FileText, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ApproveQuotationDialog } from '@/components/quotations/approve-quotation-dialog';
import { QuotationDetailDialog } from '@/components/quotations/quotation-detail-dialog';
import { QuotationFormDialog } from '@/components/quotations/quotation-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingTable } from '@/components/shared/loading-state';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { quotationService } from '@/services/quotationService';
import type { Quotation, QuotationFilters, QuotationItem } from '@/types/domain';

interface Props {
  companyId: string;
  canCreate?: boolean;
  onProjectStarted?: () => void;
}

export function QuotationsTab({ companyId, canCreate = false, onProjectStarted }: Props) {
  const { profile } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<QuotationFilters>({});

  // View detail state
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);

  // Approve dialog state
  const [approveQuotation, setApproveQuotation] = useState<Quotation | null>(null);
  const [approveItems, setApproveItems] = useState<QuotationItem[]>([]);
  const [isLoadingApproveItems, setIsLoadingApproveItems] = useState(false);

  // Edit dialog state
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [editItems, setEditItems] = useState<QuotationItem[]>([]);
  const [loadingEditQuotationId, setLoadingEditQuotationId] = useState<string | null>(null);

  // Delete dialog state
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await quotationService.listQuotations(companyId, filters);
      setQuotations(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load quotations.'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filters]);

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  const handleDeleteQuotation = async () => {
    if (!quotationToDelete || !profile) {
      return;
    }

    setIsDeleting(true);

    try {
      await quotationService.deleteQuotation(quotationToDelete.id, profile.id);
      toast.success('Quotation deleted.');
      setQuotationToDelete(null);
      await loadQuotations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete quotation.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenApprove = async (q: Quotation) => {
    setApproveQuotation(q);
    setIsLoadingApproveItems(true);
    try {
      const items = await quotationService.getQuotationItems(q.id);
      setApproveItems(items);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load quotation items.'));
      setApproveQuotation(null);
    } finally {
      setIsLoadingApproveItems(false);
    }
  };

  const handleOpenEdit = async (q: Quotation) => {
    setLoadingEditQuotationId(q.id);
    try {
      const items = await quotationService.getQuotationItems(q.id);
      setEditItems(items);
      setEditQuotation(q);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load quotation items.'));
    } finally {
      setLoadingEditQuotationId(null);
    }
  };

  const handleProjectStarted = () => {
    void loadQuotations();
    onProjectStarted?.();
  };

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
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="quotations-from-date">Start date</Label>
              <Input
                id="quotations-from-date"
                max={filters.toDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    fromDate: event.target.value || undefined,
                  }))
                }
                type="date"
                value={filters.fromDate ?? ''}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="quotations-to-date">End date</Label>
              <Input
                id="quotations-to-date"
                min={filters.fromDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    toDate: event.target.value || undefined,
                  }))
                }
                type="date"
                value={filters.toDate ?? ''}
              />
            </div>
            {filters.fromDate || filters.toDate ? (
              <Button
                onClick={() => setFilters({})}
                variant="ghost"
              >
                Clear dates
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <LoadingTable />
          ) : quotations.length === 0 ? (
            <EmptyState
              actionLabel={canCreate && !filters.fromDate && !filters.toDate ? 'New Quotation' : undefined}
              description={
                filters.fromDate || filters.toDate
                  ? 'No quotations fall within the selected date range.'
                  : 'Create your first customer estimate.'
              }
              icon={FileText}
              onAction={
                canCreate && !filters.fromDate && !filters.toDate
                  ? () => setFormOpen(true)
                  : undefined
              }
              title={filters.fromDate || filters.toDate ? 'No matching quotations' : 'No quotations yet'}
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
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
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
                      <td className="px-4 py-3 text-center">
                        {q.status === 'approved' ? (
                          <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="size-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100" variant="outline">
                            <Clock className="size-3" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="size-8"
                              size="sm"
                              variant="ghost"
                            >
                              <MoreVertical className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailQuotation(q)}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={loadingEditQuotationId === q.id}
                              onClick={() => void handleOpenEdit(q)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            {q.status === 'pending' ? (
                              <DropdownMenuItem
                                className="text-green-700 focus:text-green-700"
                                disabled={isLoadingApproveItems}
                                onClick={() => void handleOpenApprove(q)}
                              >
                                Mark as Approved
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setQuotationToDelete(q)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        isOpen={formOpen || Boolean(editQuotation)}
        onCreated={() => void loadQuotations()}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditQuotation(null);
          }
        }}
        quotation={editQuotation}
        quotationItems={editItems}
      />

      <QuotationDetailDialog
        isOpen={Boolean(detailQuotation)}
        onOpenChange={(open) => !open && setDetailQuotation(null)}
        quotation={detailQuotation}
      />

      <ApproveQuotationDialog
        isOpen={Boolean(approveQuotation) && !isLoadingApproveItems}
        items={approveItems}
        onOpenChange={(open) => !open && setApproveQuotation(null)}
        onProjectStarted={handleProjectStarted}
        quotation={approveQuotation}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setQuotationToDelete(null)}
        open={Boolean(quotationToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This performs a soft delete and stores who removed the record.
              {quotationToDelete ? (
                <>
                  {' '}
                  <span className="font-semibold text-slate-900">
                    {quotationToDelete.estId}
                  </span>{' '}
                  for {quotationToDelete.customerName} will be removed from this list.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={() => void handleDeleteQuotation()}>
              {isDeleting ? 'Deleting...' : 'Delete quotation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
