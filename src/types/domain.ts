export type Role = 'admin' | 'member';

export interface ProfileSummary {
  id: string;
  email: string;
  username: string;
  role: Role;
}

export interface Profile extends ProfileSummary {
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  companyId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: ProfileSummary | null;
}

export interface Company {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  memberCount: number;
  inventoryCount: number;
  recentActivity: ActivityLog[];
  createdByProfile?: ProfileSummary | null;
  updatedByProfile?: ProfileSummary | null;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  addedBy: string;
  removedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  profile?: ProfileSummary | null;
  addedByProfile?: ProfileSummary | null;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  maxSellingPrice: number;
  minSellingPrice: number;
  quantity: number;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdByProfile?: ProfileSummary | null;
  updatedByProfile?: ProfileSummary | null;
}

export interface Sale {
  id: string;
  companyId: string;
  inventoryItemId: string;
  soldBy: string;
  quantitySold: number;
  sellingPricePerUnit: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
  product?: InventoryItem | null;
  seller?: ProfileSummary | null;
}

export interface Notification {
  id: string;
  companyId: string;
  title: string;
  message: string;
  createdBy: string | null;
  createdAt: string;
  isRead: boolean;
  creator?: ProfileSummary | null;
}

export interface DashboardMetrics {
  totalCompanies: number;
  totalInventoryItems: number;
  totalSales: number;
  totalRevenue: number;
  totalUnitsSold: number;
  lowStockItems: number;
  estimatedStockValue: number;
  recentSales: Sale[];
  recentNotifications: Notification[];
}

export interface InventoryAnalytics {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  estimatedStockValue: number;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalUnitsSold: number;
  totalTransactions: number;
  dailySales: Array<{
    date: string;
    revenue: number;
    units: number;
  }>;
  bestSellingProducts: Array<{
    name: string;
    units: number;
    revenue: number;
  }>;
}

export interface InventoryFilters {
  search: string;
  sortBy: 'title' | 'quantity' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
  stockFilter: 'all' | 'low' | 'in-stock' | 'out-of-stock';
  page: number;
  pageSize: number;
  view: 'cards' | 'table';
}

export interface SalesFilters {
  fromDate?: string;
  toDate?: string;
  inventoryItemId?: string;
  soldBy?: string;
}

export interface Quotation {
  id: string;
  companyId: string;
  estId: string;
  customerName: string;
  customerAddress: string;
  quoteDate: string;
  subtotal: number;
  total: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  slNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
