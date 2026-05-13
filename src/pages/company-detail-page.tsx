import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  Building2,
  Clock3,
  DollarSign,
  Plus,
  ReceiptText,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { MemberFormDialog } from '@/components/companies/member-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingGrid, LoadingTable } from '@/components/shared/loading-state';
import { MetricCard } from '@/components/shared/metric-card';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { companyService } from '@/services/companyService';
import { inventoryService } from '@/services/inventoryService';
import { salesService } from '@/services/salesService';
import type { Company, CompanyMember, InventoryItem, Sale } from '@/types/domain';

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null);

  const loadCompany = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setIsLoading(true);

    try {
      const [nextCompany, nextMembers, nextInventory, nextSales] = await Promise.all([
        companyService.getCompanyById(companyId),
        companyService.getCompanyMembers(companyId),
        inventoryService.listInventoryItems(companyId),
        salesService.listSales(companyId),
      ]);

      setCompany(nextCompany);
      setMembers(nextMembers);
      setInventoryItems(nextInventory);
      setSales(nextSales);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load company details.'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  const revenue = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    [sales],
  );
  const lowStockItems = useMemo(
    () => inventoryItems.filter((item) => item.quantity <= 10).length,
    [inventoryItems],
  );

  const handleCreateMember = async (values: {
    email: string;
    username: string;
    password: string;
  }) => {
    if (!profile || !companyId) {
      return;
    }

    setIsSubmittingMember(true);

    try {
      await companyService.addMember(companyId, values, profile.id);
      toast.success('Company member created.');
      setMemberDialogOpen(false);
      await loadCompany();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create member.'));
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!profile || !memberToRemove) {
      return;
    }

    try {
      await companyService.removeMember(memberToRemove.id, profile.id);
      toast.success('Member removed from company.');
      setMemberToRemove(null);
      await loadCompany();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove member.'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingGrid />
        <LoadingTable />
      </div>
    );
  }

  if (!company) {
    return (
      <EmptyState
        description="This company is not available or you don't have access."
        icon={Building2}
        title="Company unavailable"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={company.description || 'Manage inventory, members, and sales for this company.'}
        eyebrow="Company detail"
        title={company.name}
        action={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={`/companies/${company.id}/inventory`}>
                Inventory
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/companies/${company.id}/sales`}>
                Sales
                <ReceiptText className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper="Team members in this company."
          icon={Users}
          title="Members"
          value={members.length}
        />
        <MetricCard
          accent="from-chart-2/15 via-white to-chart-2/5"
          helper="Products in inventory."
          icon={Boxes}
          title="Inventory items"
          value={inventoryItems.length}
        />
        <MetricCard
          accent="from-chart-3/15 via-white to-chart-3/5"
          helper="Total revenue from sales."
          icon={DollarSign}
          title="Revenue"
          value={formatCurrency(revenue)}
        />
        <MetricCard
          accent="from-chart-4/15 via-white to-chart-4/5"
          helper="Products running low."
          icon={Clock3}
          title="Low stock items"
          value={lowStockItems}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Workspace summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Created by
                  </p>
                  <p className="mt-2 font-medium text-slate-950">
                    {company.createdByProfile?.username ?? company.createdByProfile?.email ?? 'Unknown'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Last updated by
                  </p>
                  <p className="mt-2 font-medium text-slate-950">
                    {company.updatedByProfile?.username ?? company.createdByProfile?.username ?? 'Unknown'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatRelativeTime(company.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent activity yet.
                  </p>
                ) : (
                  company.recentActivity.slice(0, 5).map((activity) => (
                    <div className="rounded-2xl border border-border/70 p-4" key={activity.id}>
                      <p className="font-medium text-slate-950">{activity.description}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.actor?.username ?? 'System'} •{' '}
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Company members</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Members can only see records for companies they belong to.
                </p>
              </div>
              {profile?.role === 'admin' ? (
                <Button onClick={() => setMemberDialogOpen(true)}>
                  <Plus className="size-4" />
                  Add member
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {members.length === 0 ? (
                <EmptyState
                  actionLabel={profile?.role === 'admin' ? 'Add member' : undefined}
                  description="Add your first team member."
                  icon={Users}
                  onAction={profile?.role === 'admin' ? () => setMemberDialogOpen(true) : undefined}
                  title="No members assigned yet"
                />
              ) : (
                members.map((member) => (
                  <div
                    className="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between"
                    key={member.id}
                  >
                    <div>
                      <p className="font-medium text-slate-950">
                        {member.profile?.username ?? member.profile?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.profile?.email} • {member.profile?.role}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Added by {member.addedByProfile?.username ?? 'Unknown'}
                      </p>
                    </div>
                    {profile?.role === 'admin' ? (
                      <Button onClick={() => setMemberToRemove(member)} variant="ghost">
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Recent items currently tracked in this company.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to={`/companies/${company.id}/inventory`}>Open inventory</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inventory items yet.</p>
              ) : (
                inventoryItems.slice(0, 5).map((item) => (
                  <div className="rounded-2xl border border-border/70 p-4" key={item.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-950">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} units • {formatCurrency(item.minSellingPrice)} -{' '}
                          {formatCurrency(item.maxSellingPrice)}
                        </p>
                      </div>
                      {item.quantity <= 10 ? <Badge variant="warning">Low stock</Badge> : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Most recent transactions for this company.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to={`/companies/${company.id}/sales`}>Open sales history</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
              ) : (
                sales.slice(0, 5).map((sale) => (
                  <div className="rounded-2xl border border-border/70 p-4" key={sale.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          {sale.product?.title ?? 'Unknown product'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sale.quantitySold} units by {sale.seller?.username ?? 'Unknown'}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-950">
                        {formatCurrency(sale.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Activity logs will appear here as records change.
                </p>
              ) : (
                company.recentActivity.map((activity) => (
                  <div
                    className="rounded-[1.5rem] border border-border/70 p-5"
                    key={activity.id}
                  >
                    <p className="font-medium text-slate-950">{activity.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.actor?.username ?? 'System'} • {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MemberFormDialog
        isOpen={memberDialogOpen}
        isSubmitting={isSubmittingMember}
        onOpenChange={setMemberDialogOpen}
        onSubmit={handleCreateMember}
      />

      <AlertDialog onOpenChange={(open) => !open && setMemberToRemove(null)} open={Boolean(memberToRemove)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              The member will lose access to this company’s inventory, sales, and notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRemoveMember()}>
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
