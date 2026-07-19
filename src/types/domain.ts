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
  kwPv: string | null;
  ipRating: string | null;
  warranty: string | null;
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
  customerName: string | null;
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

export interface QuotationFilters {
  fromDate?: string;
  toDate?: string;
}

export interface ProjectFilters {
  fromDate?: string;
  toDate?: string;
}

export type QuotationStatus = 'pending' | 'approved';

export interface Quotation {
  id: string;
  companyId: string;
  estId: string;
  customerName: string;
  customerAddress: string;
  quoteDate: string;
  subtotal: number;
  total: number;
  status: QuotationStatus;
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

export type ProjectStatus = 'in_progress' | 'completed';

export interface Project {
  id: string;
  companyId: string;
  quotationId: string;
  estId: string;
  customerName: string;
  customerAddress: string;
  quoteTotal: number;
  totalCost: number;
  profitAmount: number;
  profitPercentage: number;
  status: ProjectStatus;
  startedAt: string;
  completedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface ProjectItem {
  id: string;
  projectId: string;
  slNo: number;
  description: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  saleAmount: number;
  costAmount: number;
}

// ---------------------------------------------------------------------------
// Public website content ("Site Data")
// ---------------------------------------------------------------------------

export interface SiteBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  authorName: string | null;
  isPublished: boolean;
  publishedAt: string;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdByProfile?: ProfileSummary | null;
}

export interface SiteShopCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SiteShopBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  categoryId: string;
  sortOrder: number;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SiteShopItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  categoryId: string | null;
  brandId: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category?: SiteShopCategory | null;
  brand?: SiteShopBrand | null;
}

export type ProjectType = 'OnGrid' | 'Hybrid';

export interface SiteProject {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  capacityKw: number | null;
  imageUrl: string | null;
  completedOn: string | null;
  projectType: ProjectType;
  isPublished: boolean;
  sortOrder: number;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SitePartner {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SiteHomeSlide {
  id: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SiteQuotation {
  id: string;
  quoteNumber: string;
  title: string;
  customerAddress: string | null;
  quoteDate: string;
  notes: string | null;
  subtotal: number;
  total: number;
  isPublished: boolean;
  sortOrder: number;
  createdBy: string;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  items: SiteQuotationItem[];
}

export interface SiteQuotationItem {
  id: string;
  siteQuotationId: string;
  slNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export const SITE_SETTINGS_KEYS = [
  'whatsapp_number',
  'contact_email',
  'contact_address',

  // Hero (Home)
  'hero_eyebrow',
  'hero_headline',
  'hero_subheadline',
  'hero_stat1_value',
  'hero_stat1_label',
  'hero_stat2_value',
  'hero_stat2_label',
  'hero_stat3_value',
  'hero_stat3_label',

  // About teaser (Home)
  'about_teaser_heading',
  'about_teaser_point1',
  'about_teaser_point2',
  'about_teaser_point3',

  // Brands marquee (Home)
  'brands_marquee_title',
  'brands_marquee_empty_text',

  // Projects preview (Home)
  'projects_preview_eyebrow',
  'projects_preview_title',
  'projects_preview_description',
  'projects_preview_empty_title',
  'projects_preview_empty_description',

  // Shop preview (Home)
  'shop_preview_eyebrow',
  'shop_preview_title',
  'shop_preview_description',
  'shop_preview_empty_title',
  'shop_preview_empty_description',

  // Blog preview (Home)
  'blog_preview_eyebrow',
  'blog_preview_title',
  'blog_preview_description',
  'blog_preview_empty_title',
  'blog_preview_empty_description',

  // Partner marquee (Home)
  'partners_marquee_title',
  'partners_marquee_empty_text',

  // CTA band (Home + About)
  'cta_heading',
  'cta_description',

  // About page
  'about_page_eyebrow',
  'about_title',
  'about_body',
  'about_value1_title',
  'about_value1_body',
  'about_value2_title',
  'about_value2_body',
  'about_value3_title',
  'about_value3_body',
  'about_process_heading',
  'about_process_description',
  'about_process1_title',
  'about_process1_body',
  'about_process2_title',
  'about_process2_body',
  'about_process3_title',
  'about_process3_body',
] as const;

export type SiteSettingKey = (typeof SITE_SETTINGS_KEYS)[number];

export type SiteSettings = Record<SiteSettingKey, string>;
