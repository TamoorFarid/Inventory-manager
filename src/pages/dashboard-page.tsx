import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Building2, DollarSign, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { CompanyCard } from '@/components/companies/company-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingGrid, LoadingTable } from '@/components/shared/loading-state';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { getErrorMessage } from '@/lib/errors';
import { getUserCompanyIds } from '@/lib/membership';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { companyService } from '@/services/companyService';
import { inventoryService } from '@/services/inventoryService';
import { notificationService } from '@/services/notificationService';
import { salesService } from '@/services/salesService';
import type { Company, DashboardMetrics } from '@/types/domain';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!profile) {
      return;
    }

    setIsLoading(true);

    try {
      const nextCompanies = await companyService.listCompanies();
      const companyIds = nextCompanies.map((company) => company.id);
      
      // Get all company members to determine which companies user belongs to
      const allMembersGroups = await Promise.all(
        companyIds.map((companyId) => companyService.getCompanyMembers(companyId))
      );
      const allMembers = allMembersGroups.flat();
      const userCompanyIds = getUserCompanyIds(profile.id, allMembers);
      
      const [inventoryGroups, salesGroups, recentNotifications] = await Promise.all([
        Promise.all(companyIds.map((companyId) => inventoryService.listInventoryItems(companyId))),
        // Only fetch sales for companies user is a member of
        Promise.all(userCompanyIds.map((companyId) => salesService.listSales(companyId))),
        notificationService.listNotifications(profile.id, undefined, 6),
      ]);

      const inventoryItems = inventoryGroups.flat();
      const sales = salesGroups
        .flat()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const lowStockItems = inventoryItems.filter((item) => item.quantity <= 10).length;
      const estimatedStockValue = inventoryItems.reduce(
        (sum, item) => sum + item.quantity * item.maxSellingPrice,
        0,
      );

      setCompanies(nextCompanies);
      setMetrics({
        totalCompanies: nextCompanies.length,
        totalInventoryItems: inventoryItems.length,
        totalSales: sales.length,
        totalRevenue,
        totalUnitsSold,
        lowStockItems,
        estimatedStockValue,
        recentSales: sales.slice(0, 6),
        recentNotifications,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load the dashboard.'));
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useRealtimeNotifications({
    onRefresh: loadDashboard,
  });

  const greeting = useMemo(() => {
    return 'Manage inventory and sales across all companies in one centralized platform.';
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        description={greeting}
        eyebrow="Dashboard"
        title="Your inventory overview"
        action={
          <Button asChild>
            <Link to="/companies">Open companies</Link>
          </Button>
        }
      />

      {isLoading || !metrics ? (
        <>
          <LoadingGrid />
          <LoadingTable />
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              accent="from-primary/15 via-white to-primary/5"
              helper="Companies you have access to."
              icon={Building2}
              title="Companies"
              value={metrics.totalCompanies}
            />
            <MetricCard
              accent="from-chart-2/15 via-white to-chart-2/5"
              helper="Total products across all companies."
              icon={Boxes}
              title="Inventory items"
              value={metrics.totalInventoryItems}
            />
            <MetricCard
              accent="from-chart-3/20 via-white to-chart-3/5"
              helper="Total revenue from sales."
              icon={DollarSign}
              title="Revenue"
              value={formatCurrency(metrics.totalRevenue)}
            />
            <MetricCard
              accent="from-chart-4/20 via-white to-chart-4/5"
              helper="Items running low on stock."
              icon={TriangleAlert}
              title="Low stock"
              value={metrics.lowStockItems}
            />
          </div>

          {companies.length === 0 ? (
            <EmptyState
              actionLabel="Create your first company"
              description="Your dashboard will show metrics once companies are set up."
              icon={Building2}
              onAction={undefined}
              title="No company workspaces yet"
            />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent sales</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Latest transactions across your accessible companies
                      </p>
                    </div>
                    <Badge variant="outline">{metrics.totalSales} total</Badge>
                  </CardHeader>
                  <CardContent>
                    {metrics.recentSales.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No sales recorded yet.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Seller</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metrics.recentSales.map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell>{sale.product?.title ?? 'Unknown product'}</TableCell>
                              <TableCell>{sale.seller?.username ?? 'Unknown seller'}</TableCell>
                              <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                              <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent notifications</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Live activity updates delivered through Supabase Realtime
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {metrics.recentNotifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Notifications will appear once sales activity starts.
                      </p>
                    ) : (
                      metrics.recentNotifications.map((notification) => (
                        <div
                          className="rounded-2xl border border-border/70 p-4"
                          key={notification.id}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-medium text-slate-950">
                                {notification.title}
                              </p>
                              <p className="text-sm leading-6 text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead ? <Badge>New</Badge> : null}
                          </div>
                          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                      Company workspaces
                    </p>
                    <h2 className="font-display text-2xl font-semibold text-slate-950">
                      Where your inventory lives
                    </h2>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/companies">Manage companies</Link>
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {companies.slice(0, 4).map((company) => (
                    <CompanyCard company={company} key={company.id} />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
