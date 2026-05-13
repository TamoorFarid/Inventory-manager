import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, DollarSign, Plus, ReceiptText, ShoppingCart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { SaleFormDialog } from '@/components/sales/sale-form-dialog';
import { SalesCharts } from '@/components/sales/sales-charts';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingGrid } from '@/components/shared/loading-state';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { downloadCsv, formatCurrency, formatDateTime } from '@/lib/utils';
import { companyService } from '@/services/companyService';
import { inventoryService } from '@/services/inventoryService';
import { salesService } from '@/services/salesService';
import type { Company, CompanyMember, InventoryItem, Sale, SalesFilters } from '@/types/domain';

export default function SalesHistoryPage() {
  const { companyId } = useParams();
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const loadPage = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setIsLoading(true);

    try {
      const [nextCompany, nextInventory, nextMembers, nextSales] = await Promise.all([
        companyService.getCompanyById(companyId),
        inventoryService.listInventoryItems(companyId),
        companyService.getCompanyMembers(companyId),
        salesService.listSales(companyId, filters),
      ]);

      setCompany(nextCompany);
      setInventoryItems(nextInventory);
      setMembers(nextMembers);
      setSales(nextSales);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load sales history.'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filters]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const analytics = useMemo(() => salesService.buildSalesAnalytics(sales), [sales]);
  const averageOrderValue = analytics.totalTransactions
    ? analytics.totalRevenue / analytics.totalTransactions
    : 0;

  const handleRecordSale = async (values: {
    inventoryItemId: string;
    quantitySold: number;
    sellingPricePerUnit: number;
  }) => {
    if (!companyId || !profile) {
      return;
    }

    setIsSubmittingSale(true);

    try {
      await salesService.recordSale({
        companyId,
        inventoryItemId: values.inventoryItemId,
        quantitySold: values.quantitySold,
        sellingPricePerUnit: values.sellingPricePerUnit,
      });
      toast.success('Sale recorded and notification sent.');
      setSaleDialogOpen(false);
      await loadPage();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to record sale.'));
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      `${company?.name ?? 'sales'}-history.csv`,
      [
        ['Product', 'Quantity', 'Unit Price', 'Total', 'Seller', 'Timestamp'],
        ...sales.map((sale) => [
          sale.product?.title ?? 'Unknown product',
          sale.quantitySold.toString(),
          sale.sellingPricePerUnit.toString(),
          sale.totalAmount.toString(),
          sale.seller?.username ?? 'Unknown seller',
          sale.createdAt,
        ]),
      ],
    );
  };

  if (isLoading) {
    return <LoadingGrid />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Track revenue, units sold, and product momentum for ${company?.name ?? 'this company'}.`}
        eyebrow="Sales history"
        title={company?.name ?? 'Sales'}
        action={
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportCsv} variant="outline">
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={() => setSaleDialogOpen(true)}>
              <Plus className="size-4" />
              Record sale
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper="Revenue captured in the filtered period."
          icon={DollarSign}
          title="Revenue"
          value={formatCurrency(analytics.totalRevenue)}
        />
        <MetricCard
          accent="from-chart-2/15 via-white to-chart-2/5"
          helper="Units sold across matching transactions."
          icon={ShoppingCart}
          title="Units sold"
          value={analytics.totalUnitsSold}
        />
        <MetricCard
          accent="from-chart-3/15 via-white to-chart-3/5"
          helper="Number of completed sale records."
          icon={ReceiptText}
          title="Transactions"
          value={analytics.totalTransactions}
        />
        <MetricCard
          accent="from-chart-4/15 via-white to-chart-4/5"
          helper="Average value per transaction in the current view."
          icon={DollarSign}
          title="Avg. order value"
          value={formatCurrency(averageOrderValue)}
        />
      </div>

      <div className="rounded-[1.75rem] border border-white/70 bg-white/95 p-5 shadow-panel">
        <div className="grid gap-4 lg:grid-cols-4">
          <Input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                fromDate: event.target.value || undefined,
              }))
            }
            type="date"
            value={filters.fromDate ?? ''}
          />
          <Input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                toDate: event.target.value || undefined,
              }))
            }
            type="date"
            value={filters.toDate ?? ''}
          />
          <Select
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                inventoryItemId: value === 'all' ? undefined : value,
              }))
            }
            value={filters.inventoryItemId ?? 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                soldBy: value === 'all' ? undefined : value,
              }))
            }
            value={filters.soldBy ?? 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder="All sellers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sellers</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.profile?.username ?? member.profile?.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SalesCharts analytics={analytics} />

      <Card>
        <CardHeader>
          <CardTitle>Best-selling products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.bestSellingProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Product performance will appear once sales are recorded.
            </p>
          ) : (
            analytics.bestSellingProducts.map((product) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-border/70 p-4"
                key={product.name}
              >
                <div>
                  <p className="font-medium text-slate-950">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.units} units sold
                  </p>
                </div>
                <p className="font-semibold text-slate-950">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <EmptyState
              actionLabel="Record sale"
              description="Create the first transaction to unlock charts, revenue trends, and notifications."
              icon={ReceiptText}
              onAction={() => setSaleDialogOpen(true)}
              title="No sales match these filters"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.product?.title ?? 'Unknown product'}</TableCell>
                    <TableCell>{sale.quantitySold}</TableCell>
                    <TableCell>{formatCurrency(sale.sellingPricePerUnit)}</TableCell>
                    <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell>{sale.seller?.username ?? 'Unknown seller'}</TableCell>
                    <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SaleFormDialog
        inventoryItems={inventoryItems}
        isOpen={saleDialogOpen}
        isSubmitting={isSubmittingSale}
        onOpenChange={setSaleDialogOpen}
        onSubmit={handleRecordSale}
      />
    </div>
  );
}
