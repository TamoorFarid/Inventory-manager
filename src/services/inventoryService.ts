import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { InventoryValues } from '@/lib/validators';
import { profileService } from '@/services/profileService';
import type {
  InventoryAnalytics,
  InventoryFilters,
  InventoryItem,
} from '@/types/domain';

interface InventoryItemRow {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  max_selling_price: number;
  min_selling_price: number;
  quantity: number;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    maxSellingPrice: Number(row.max_selling_price),
    minSellingPrice: Number(row.min_selling_price),
    quantity: row.quantity,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function listInventoryItems(companyId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(
      'id, company_id, title, description, max_selling_price, min_selling_price, quantity, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const items = (data ?? []).map((row) => mapInventoryItem(row as InventoryItemRow));
  const profiles = await profileService.getProfilesByIds(
    items.flatMap((item) => [item.createdBy, item.updatedBy ?? '']),
  );

  return items.map((item) => ({
    ...item,
    createdByProfile: profiles[item.createdBy] ?? null,
    updatedByProfile: item.updatedBy ? profiles[item.updatedBy] ?? null : null,
  }));
}

async function createInventoryItem(
  companyId: string,
  values: InventoryValues,
  userId: string,
) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      company_id: companyId,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      max_selling_price: values.maxSellingPrice,
      min_selling_price: values.minSellingPrice,
      quantity: values.quantity,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      'id, company_id, title, description, max_selling_price, min_selling_price, quantity, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return mapInventoryItem(data as InventoryItemRow);
}

async function updateInventoryItem(
  itemId: string,
  values: InventoryValues,
  userId: string,
) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      max_selling_price: values.maxSellingPrice,
      min_selling_price: values.minSellingPrice,
      quantity: values.quantity,
      updated_by: userId,
    })
    .eq('id', itemId)
    .select(
      'id, company_id, title, description, max_selling_price, min_selling_price, quantity, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return mapInventoryItem(data as InventoryItemRow);
}

async function deleteInventoryItem(itemId: string, userId: string) {
  const { error } = await supabase
    .from('inventory_items')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId,
    })
    .eq('id', itemId);

  if (error) {
    throw error;
  }
}

function buildInventoryAnalytics(items: InventoryItem[]): InventoryAnalytics {
  return {
    totalProducts: items.length,
    totalStock: items.reduce((sum, item) => sum + item.quantity, 0),
    lowStockItems: items.filter((item) => item.quantity <= LOW_STOCK_THRESHOLD).length,
    estimatedStockValue: items.reduce(
      (sum, item) => sum + item.quantity * item.maxSellingPrice,
      0,
    ),
  };
}

function applyInventoryFilters(items: InventoryItem[], filters: InventoryFilters) {
  const filtered = items.filter((item) => {
    const query = filters.search.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query);

    const matchesStock =
      filters.stockFilter === 'all' ||
      (filters.stockFilter === 'low' && item.quantity <= LOW_STOCK_THRESHOLD) ||
      (filters.stockFilter === 'in-stock' && item.quantity > 0) ||
      (filters.stockFilter === 'out-of-stock' && item.quantity === 0);

    return matchesQuery && matchesStock;
  });

  filtered.sort((left, right) => {
    const direction = filters.sortDirection === 'asc' ? 1 : -1;

    if (filters.sortBy === 'title') {
      return left.title.localeCompare(right.title) * direction;
    }

    if (filters.sortBy === 'quantity') {
      return (left.quantity - right.quantity) * direction;
    }

    if (filters.sortBy === 'updatedAt') {
      return (
        (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()) *
        direction
      );
    }

    return (
      (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) *
      direction
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const startIndex = (page - 1) * filters.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + filters.pageSize);

  return {
    items: paginated,
    total,
    totalPages,
    page,
  };
}

export const inventoryService = {
  applyInventoryFilters,
  buildInventoryAnalytics,
  createInventoryItem,
  deleteInventoryItem,
  listInventoryItems,
  updateInventoryItem,
};
