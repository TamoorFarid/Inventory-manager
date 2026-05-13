import { format } from 'date-fns';

import { groupByDay } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { inventoryService } from '@/services/inventoryService';
import { profileService } from '@/services/profileService';
import type { Sale, SalesAnalytics, SalesFilters } from '@/types/domain';

interface SaleRow {
  id: string;
  company_id: string;
  inventory_item_id: string;
  sold_by: string;
  quantity_sold: number;
  selling_price_per_unit: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

function mapSale(row: SaleRow): Sale {
  return {
    id: row.id,
    companyId: row.company_id,
    inventoryItemId: row.inventory_item_id,
    soldBy: row.sold_by,
    quantitySold: row.quantity_sold,
    sellingPricePerUnit: Number(row.selling_price_per_unit),
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
  };
}

async function listSales(companyId: string, filters?: SalesFilters) {
  let query = supabase
    .from('sales')
    .select(
      'id, company_id, inventory_item_id, sold_by, quantity_sold, selling_price_per_unit, total_amount, created_at, updated_at, deleted_at, deleted_by',
    )
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.fromDate) {
    query = query.gte('created_at', `${filters.fromDate}T00:00:00`);
  }

  if (filters?.toDate) {
    query = query.lte('created_at', `${filters.toDate}T23:59:59`);
  }

  if (filters?.inventoryItemId) {
    query = query.eq('inventory_item_id', filters.inventoryItemId);
  }

  if (filters?.soldBy) {
    query = query.eq('sold_by', filters.soldBy);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const sales = (data ?? []).map((row) => mapSale(row as SaleRow));
  const [profiles, products] = await Promise.all([
    profileService.getProfilesByIds(sales.map((sale) => sale.soldBy)),
    inventoryService.listInventoryItems(companyId),
  ]);

  const productsById = products.reduce<Record<string, (typeof products)[number]>>(
    (accumulator, item) => {
      accumulator[item.id] = item;
      return accumulator;
    },
    {},
  );

  return sales.map((sale) => ({
    ...sale,
    seller: profiles[sale.soldBy] ?? null,
    product: productsById[sale.inventoryItemId] ?? null,
  }));
}

async function recordSale(input: {
  companyId: string;
  inventoryItemId: string;
  quantitySold: number;
  sellingPricePerUnit: number;
}) {
  const { error } = await supabase.rpc('record_sale', {
    p_company_id: input.companyId,
    p_inventory_item_id: input.inventoryItemId,
    p_quantity_sold: input.quantitySold,
    p_selling_price_per_unit: input.sellingPricePerUnit,
  });

  if (error) {
    throw error;
  }
}

function buildSalesAnalytics(sales: Sale[]): SalesAnalytics {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);

  const dailySales = Object.entries(groupByDay(sales)).map(([date, entries]) => ({
    date: format(new Date(date), 'MMM d'),
    revenue: entries.reduce((sum, sale) => sum + sale.totalAmount, 0),
    units: entries.reduce((sum, sale) => sum + sale.quantitySold, 0),
  }));

  const productMap = sales.reduce<Record<string, { name: string; units: number; revenue: number }>>(
    (accumulator, sale) => {
      const key = sale.inventoryItemId;
      const current = accumulator[key] ?? {
        name: sale.product?.title ?? 'Unknown product',
        units: 0,
        revenue: 0,
      };

      current.units += sale.quantitySold;
      current.revenue += sale.totalAmount;
      accumulator[key] = current;

      return accumulator;
    },
    {},
  );

  return {
    totalRevenue,
    totalUnitsSold,
    totalTransactions: sales.length,
    dailySales,
    bestSellingProducts: Object.values(productMap)
      .sort((left, right) => right.units - left.units)
      .slice(0, 5),
  };
}

export const salesService = {
  buildSalesAnalytics,
  listSales,
  recordSale,
};
