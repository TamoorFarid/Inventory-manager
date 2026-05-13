import { useCallback, useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { CompanyCard } from '@/components/companies/company-card';
import { CompanyFormDialog } from '@/components/companies/company-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingGrid } from '@/components/shared/loading-state';
import { PageHeader } from '@/components/shared/page-header';
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
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { companyService } from '@/services/companyService';
import type { Company } from '@/types/domain';

export default function CompaniesPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);

    try {
      setCompanies(await companyService.listCompanies());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load companies.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const handleSubmit = async (values: { name: string; description?: string }) => {
    if (!profile) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, values, profile.id);
        toast.success('Company updated.');
      } else {
        await companyService.createCompany(values, profile.id);
        toast.success('Company created.');
      }

      setCompanyDialogOpen(false);
      setEditingCompany(null);
      await loadCompanies();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save company.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!profile || !companyToDelete) {
      return;
    }

    try {
      await companyService.archiveCompany(companyToDelete.id, profile.id);
      toast.success('Company archived.');
      setCompanyToDelete(null);
      await loadCompanies();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to archive company.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Create, refine, and review company workspaces with clean member and inventory boundaries."
        eyebrow="Companies"
        title="Manage company workspaces"
        action={
          profile?.role === 'admin' ? (
            <Button
              onClick={() => {
                setEditingCompany(null);
                setCompanyDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create company
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingGrid />
      ) : companies.length === 0 ? (
        <EmptyState
          actionLabel={profile?.role === 'admin' ? 'Create company' : undefined}
          description="Start by creating a company to scope members, inventory, sales, and notifications."
          icon={Building2}
          onAction={
            profile?.role === 'admin'
              ? () => {
                  setEditingCompany(null);
                  setCompanyDialogOpen(true);
                }
              : undefined
          }
          title="No companies created yet"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {companies.map((company) => (
            <CompanyCard
              actions={
                profile?.role === 'admin' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditingCompany(company);
                        setCompanyDialogOpen(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      onClick={() => setCompanyToDelete(company)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : null
              }
              company={company}
              key={company.id}
            />
          ))}
        </div>
      )}

      <CompanyFormDialog
        initialValues={
          editingCompany
            ? {
                name: editingCompany.name,
                description: editingCompany.description ?? '',
              }
            : undefined
        }
        isOpen={companyDialogOpen}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setCompanyDialogOpen(open);
          if (!open) {
            setEditingCompany(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog onOpenChange={(open) => !open && setCompanyToDelete(null)} open={Boolean(companyToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive company?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the company and hides its records through RLS-aware access checks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteCompany()}>
              Archive company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
