import { slugify } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type {
  ProjectType,
  SiteBlogPost,
  SitePartner,
  SiteProject,
  SiteQuotation,
  SiteQuotationItem,
  SiteSettingKey,
  SiteSettings,
  SiteShopBrand,
  SiteShopCategory,
  SiteShopItem,
} from '@/types/domain';
import { SITE_SETTINGS_KEYS } from '@/types/domain';

const SITE_MEDIA_BUCKET = 'site-media';
const UNIQUE_VIOLATION = '23505';

interface SiteBlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  is_published: boolean;
  published_at: string;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SiteShopCategoryRow {
  id: string;
  name: string;
  sort_order: number;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SiteShopBrandRow {
  id: string;
  name: string;
  logo_url: string | null;
  category_id: string;
  sort_order: number;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SiteShopItemRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  brand_id: string | null;
  is_available: boolean;
  sort_order: number;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SiteProjectRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  capacity_kw: number | null;
  image_url: string | null;
  completed_on: string | null;
  project_type: 'OnGrid' | 'Hybrid';
  is_published: boolean;
  sort_order: number;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SitePartnerRow {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapBlogPost(row: SiteBlogPostRow): SiteBlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    authorName: row.author_name,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapShopCategory(row: SiteShopCategoryRow): SiteShopCategory {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapShopBrand(row: SiteShopBrandRow): SiteShopBrand {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    categoryId: row.category_id,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapShopItem(row: SiteShopItemRow): SiteShopItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    imageUrl: row.image_url,
    categoryId: row.category_id,
    brandId: row.brand_id,
    isAvailable: row.is_available,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapProject(row: SiteProjectRow): SiteProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    location: row.location,
    capacityKw: row.capacity_kw === null ? null : Number(row.capacity_kw),
    imageUrl: row.image_url,
    completedOn: row.completed_on,
    projectType: row.project_type,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapPartner(row: SitePartnerRow): SitePartner {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === UNIQUE_VIOLATION);
}

function uniqueSlug(base: string) {
  const root = slugify(base) || 'item';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${root}-${suffix}`;
}

/** Uploads an image to the public site-media bucket and returns its public URL. */
async function uploadSiteImage(file: File, folder: 'blogs' | 'shop' | 'projects' | 'partners' | 'brands') {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const BLOG_COLUMNS =
  'id, title, slug, excerpt, content, cover_image_url, author_name, is_published, published_at, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

async function listBlogPosts(): Promise<SiteBlogPost[]> {
  const { data, error } = await supabase
    .from('site_blog_posts')
    .select(BLOG_COLUMNS)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapBlogPost(row as SiteBlogPostRow));
}

async function createBlogPost(
  input: {
    title: string;
    excerpt?: string | null;
    content: string;
    coverImageUrl?: string | null;
    authorName?: string | null;
    isPublished: boolean;
  },
  userId: string,
): Promise<SiteBlogPost> {
  let attempt = 0;

  while (attempt < 3) {
    const slug = uniqueSlug(input.title);
    const { data, error } = await supabase
      .from('site_blog_posts')
      .insert({
        title: input.title.trim(),
        slug,
        excerpt: input.excerpt?.trim() || null,
        content: input.content,
        cover_image_url: input.coverImageUrl || null,
        author_name: input.authorName?.trim() || null,
        is_published: input.isPublished,
        created_by: userId,
        updated_by: userId,
      })
      .select(BLOG_COLUMNS)
      .single();

    if (!error) return mapBlogPost(data as SiteBlogPostRow);
    if (!isUniqueViolation(error)) throw error;
    attempt += 1;
  }

  throw new Error('Could not generate a unique slug for this post.');
}

async function updateBlogPost(
  id: string,
  input: {
    title: string;
    excerpt?: string | null;
    content: string;
    coverImageUrl?: string | null;
    authorName?: string | null;
    isPublished: boolean;
  },
  userId: string,
): Promise<SiteBlogPost> {
  const { data, error } = await supabase
    .from('site_blog_posts')
    .update({
      title: input.title.trim(),
      excerpt: input.excerpt?.trim() || null,
      content: input.content,
      cover_image_url: input.coverImageUrl || null,
      author_name: input.authorName?.trim() || null,
      is_published: input.isPublished,
      updated_by: userId,
    })
    .eq('id', id)
    .select(BLOG_COLUMNS)
    .single();

  if (error) throw error;
  return mapBlogPost(data as SiteBlogPostRow);
}

async function deleteBlogPost(id: string, userId: string) {
  const { error } = await supabase
    .from('site_blog_posts')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

const SHOP_COLUMNS =
  'id, name, slug, description, price, currency, image_url, category_id, brand_id, is_available, sort_order, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

const SHOP_CATEGORY_COLUMNS =
  'id, name, sort_order, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

const SHOP_BRAND_COLUMNS =
  'id, name, logo_url, category_id, sort_order, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

async function listShopCategories(): Promise<SiteShopCategory[]> {
  const { data, error } = await supabase
    .from('site_shop_categories')
    .select(SHOP_CATEGORY_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapShopCategory(row as SiteShopCategoryRow));
}

async function createShopCategory(
  input: { name: string; sortOrder: number },
  userId: string,
): Promise<SiteShopCategory> {
  const { data, error } = await supabase
    .from('site_shop_categories')
    .insert({ name: input.name.trim(), sort_order: input.sortOrder, created_by: userId, updated_by: userId })
    .select(SHOP_CATEGORY_COLUMNS)
    .single();

  if (error) throw error;
  return mapShopCategory(data as SiteShopCategoryRow);
}

async function updateShopCategory(
  id: string,
  input: { name: string; sortOrder: number },
  userId: string,
): Promise<SiteShopCategory> {
  const { data, error } = await supabase
    .from('site_shop_categories')
    .update({ name: input.name.trim(), sort_order: input.sortOrder, updated_by: userId })
    .eq('id', id)
    .select(SHOP_CATEGORY_COLUMNS)
    .single();

  if (error) throw error;
  return mapShopCategory(data as SiteShopCategoryRow);
}

async function deleteShopCategory(id: string, userId: string) {
  const { error } = await supabase
    .from('site_shop_categories')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

async function listShopBrands(): Promise<SiteShopBrand[]> {
  const { data, error } = await supabase
    .from('site_shop_brands')
    .select(SHOP_BRAND_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapShopBrand(row as SiteShopBrandRow));
}

async function createShopBrand(
  input: { name: string; logoUrl: string | null; categoryId: string; sortOrder: number },
  userId: string,
): Promise<SiteShopBrand> {
  const { data, error } = await supabase
    .from('site_shop_brands')
    .insert({
      name: input.name.trim(),
      logo_url: input.logoUrl,
      category_id: input.categoryId,
      sort_order: input.sortOrder,
      created_by: userId,
      updated_by: userId,
    })
    .select(SHOP_BRAND_COLUMNS)
    .single();

  if (error) throw error;
  return mapShopBrand(data as SiteShopBrandRow);
}

async function updateShopBrand(
  id: string,
  input: { name: string; logoUrl: string | null; categoryId: string; sortOrder: number },
  userId: string,
): Promise<SiteShopBrand> {
  const { data, error } = await supabase
    .from('site_shop_brands')
    .update({
      name: input.name.trim(),
      logo_url: input.logoUrl,
      category_id: input.categoryId,
      sort_order: input.sortOrder,
      updated_by: userId,
    })
    .eq('id', id)
    .select(SHOP_BRAND_COLUMNS)
    .single();

  if (error) throw error;
  return mapShopBrand(data as SiteShopBrandRow);
}

async function deleteShopBrand(id: string, userId: string) {
  const { error } = await supabase
    .from('site_shop_brands')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

async function listShopItems(): Promise<SiteShopItem[]> {
  const { data, error } = await supabase
    .from('site_shop_items')
    .select(SHOP_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  const items = (data ?? []).map((row) => mapShopItem(row as SiteShopItemRow));

  const [categories, brands] = await Promise.all([listShopCategories(), listShopBrands()]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));

  return items.map((item) => ({
    ...item,
    category: item.categoryId ? categoryById.get(item.categoryId) ?? null : null,
    brand: item.brandId ? brandById.get(item.brandId) ?? null : null,
  }));
}

async function createShopItem(
  input: {
    name: string;
    description?: string | null;
    price: number;
    currency: string;
    imageUrl?: string | null;
    categoryId?: string | null;
    brandId?: string | null;
    isAvailable: boolean;
    sortOrder: number;
  },
  userId: string,
): Promise<SiteShopItem> {
  let attempt = 0;

  while (attempt < 3) {
    const slug = uniqueSlug(input.name);
    const { data, error } = await supabase
      .from('site_shop_items')
      .insert({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        price: input.price,
        currency: input.currency,
        image_url: input.imageUrl || null,
        category_id: input.categoryId || null,
        brand_id: input.brandId || null,
        is_available: input.isAvailable,
        sort_order: input.sortOrder,
        created_by: userId,
        updated_by: userId,
      })
      .select(SHOP_COLUMNS)
      .single();

    if (!error) return mapShopItem(data as SiteShopItemRow);
    if (!isUniqueViolation(error)) throw error;
    attempt += 1;
  }

  throw new Error('Could not generate a unique slug for this item.');
}

async function updateShopItem(
  id: string,
  input: {
    name: string;
    description?: string | null;
    price: number;
    currency: string;
    imageUrl?: string | null;
    categoryId?: string | null;
    brandId?: string | null;
    isAvailable: boolean;
    sortOrder: number;
  },
  userId: string,
): Promise<SiteShopItem> {
  const { data, error } = await supabase
    .from('site_shop_items')
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      currency: input.currency,
      image_url: input.imageUrl || null,
      category_id: input.categoryId || null,
      brand_id: input.brandId || null,
      is_available: input.isAvailable,
      sort_order: input.sortOrder,
      updated_by: userId,
    })
    .eq('id', id)
    .select(SHOP_COLUMNS)
    .single();

  if (error) throw error;
  return mapShopItem(data as SiteShopItemRow);
}

async function deleteShopItem(id: string, userId: string) {
  const { error } = await supabase
    .from('site_shop_items')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

const PROJECT_COLUMNS =
  'id, title, slug, description, location, capacity_kw, image_url, completed_on, project_type, is_published, sort_order, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

async function listSiteProjects(): Promise<SiteProject[]> {
  const { data, error } = await supabase
    .from('site_projects')
    .select(PROJECT_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProject(row as SiteProjectRow));
}

async function createSiteProject(
  input: {
    title: string;
    description?: string | null;
    location?: string | null;
    capacityKw?: number | null;
    imageUrl?: string | null;
    completedOn?: string | null;
    projectType: ProjectType;
    isPublished: boolean;
    sortOrder: number;
  },
  userId: string,
): Promise<SiteProject> {
  let attempt = 0;

  while (attempt < 3) {
    const slug = uniqueSlug(input.title);
    const { data, error } = await supabase
      .from('site_projects')
      .insert({
        title: input.title.trim(),
        slug,
        description: input.description?.trim() || null,
        location: input.location?.trim() || null,
        capacity_kw: input.capacityKw ?? null,
        image_url: input.imageUrl || null,
        completed_on: input.completedOn || null,
        project_type: input.projectType,
        is_published: input.isPublished,
        sort_order: input.sortOrder,
        created_by: userId,
        updated_by: userId,
      })
      .select(PROJECT_COLUMNS)
      .single();

    if (!error) return mapProject(data as SiteProjectRow);
    if (!isUniqueViolation(error)) throw error;
    attempt += 1;
  }

  throw new Error('Could not generate a unique slug for this project.');
}

async function updateSiteProject(
  id: string,
  input: {
    title: string;
    description?: string | null;
    location?: string | null;
    capacityKw?: number | null;
    imageUrl?: string | null;
    completedOn?: string | null;
    projectType: ProjectType;
    isPublished: boolean;
    sortOrder: number;
  },
  userId: string,
): Promise<SiteProject> {
  const { data, error } = await supabase
    .from('site_projects')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      capacity_kw: input.capacityKw ?? null,
      image_url: input.imageUrl || null,
      completed_on: input.completedOn || null,
      project_type: input.projectType,
      is_published: input.isPublished,
      sort_order: input.sortOrder,
      updated_by: userId,
    })
    .eq('id', id)
    .select(PROJECT_COLUMNS)
    .single();

  if (error) throw error;
  return mapProject(data as SiteProjectRow);
}

async function deleteSiteProject(id: string, userId: string) {
  const { error } = await supabase
    .from('site_projects')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

const PARTNER_COLUMNS =
  'id, name, logo_url, website_url, sort_order, is_active, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

async function listPartners(): Promise<SitePartner[]> {
  const { data, error } = await supabase
    .from('site_partners')
    .select(PARTNER_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapPartner(row as SitePartnerRow));
}

async function createPartner(
  input: { name: string; logoUrl: string | null; isActive: boolean; sortOrder: number },
  userId: string,
): Promise<SitePartner> {
  const { data, error } = await supabase
    .from('site_partners')
    .insert({
      name: input.name.trim(),
      logo_url: input.logoUrl,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      created_by: userId,
      updated_by: userId,
    })
    .select(PARTNER_COLUMNS)
    .single();

  if (error) throw error;
  return mapPartner(data as SitePartnerRow);
}

async function updatePartner(
  id: string,
  input: { name: string; logoUrl: string | null; isActive: boolean; sortOrder: number },
  userId: string,
): Promise<SitePartner> {
  const { data, error } = await supabase
    .from('site_partners')
    .update({
      name: input.name.trim(),
      logo_url: input.logoUrl,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      updated_by: userId,
    })
    .eq('id', id)
    .select(PARTNER_COLUMNS)
    .single();

  if (error) throw error;
  return mapPartner(data as SitePartnerRow);
}

async function deletePartner(id: string, userId: string) {
  const { error } = await supabase
    .from('site_partners')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

async function getSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('key, value');

  if (error) throw error;

  const settings = {} as SiteSettings;
  for (const key of SITE_SETTINGS_KEYS) {
    settings[key] = '';
  }
  for (const row of data ?? []) {
    if (SITE_SETTINGS_KEYS.includes(row.key as SiteSettingKey)) {
      settings[row.key as SiteSettingKey] = row.value ?? '';
    }
  }

  return settings;
}

async function updateSettings(values: Partial<SiteSettings>, userId: string) {
  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value,
    updated_by: userId,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

interface SiteQuotationRow {
  id: string;
  quote_number: string;
  title: string;
  customer_address: string | null;
  quote_date: string;
  notes: string | null;
  subtotal: number;
  total: number;
  is_published: boolean;
  sort_order: number;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SiteQuotationItemRow {
  id: string;
  site_quotation_id: string;
  sl_no: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

function mapQuotationItem(row: SiteQuotationItemRow): SiteQuotationItem {
  return {
    id: row.id,
    siteQuotationId: row.site_quotation_id,
    slNo: row.sl_no,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
  };
}

function mapQuotation(row: SiteQuotationRow, items: SiteQuotationItem[]): SiteQuotation {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    title: row.title,
    customerAddress: row.customer_address,
    quoteDate: row.quote_date,
    notes: row.notes,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    items,
  };
}

const QUOTATION_COLUMNS =
  'id, quote_number, title, customer_address, quote_date, notes, subtotal, total, is_published, sort_order, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at';

const QUOTATION_ITEM_COLUMNS = 'id, site_quotation_id, sl_no, description, quantity, unit_price, amount';

async function listSiteQuotations(): Promise<SiteQuotation[]> {
  const { data, error } = await supabase
    .from('site_quotations')
    .select(QUOTATION_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  const quotations = (data ?? []) as SiteQuotationRow[];
  if (quotations.length === 0) return [];

  const { data: itemRows, error: itemsError } = await supabase
    .from('site_quotation_items')
    .select(QUOTATION_ITEM_COLUMNS)
    .in('site_quotation_id', quotations.map((row) => row.id))
    .order('sl_no', { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByQuotation = new Map<string, SiteQuotationItem[]>();
  for (const row of (itemRows ?? []) as SiteQuotationItemRow[]) {
    const mapped = mapQuotationItem(row);
    const list = itemsByQuotation.get(mapped.siteQuotationId) ?? [];
    list.push(mapped);
    itemsByQuotation.set(mapped.siteQuotationId, list);
  }

  return quotations.map((row) => mapQuotation(row, itemsByQuotation.get(row.id) ?? []));
}

async function createSiteQuotation(
  input: {
    title: string;
    customerAddress?: string | null;
    quoteDate: string;
    notes?: string | null;
    isPublished: boolean;
    items: Array<{ slNo: number; description: string; quantity: number; unitPrice: number }>;
  },
  userId: string,
): Promise<SiteQuotation> {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const { data, error } = await supabase
    .from('site_quotations')
    .insert({
      title: input.title.trim(),
      customer_address: input.customerAddress?.trim() || null,
      quote_date: input.quoteDate,
      notes: input.notes?.trim() || null,
      subtotal,
      total: subtotal,
      is_published: input.isPublished,
      created_by: userId,
      updated_by: userId,
    })
    .select(QUOTATION_COLUMNS)
    .single();

  if (error) throw error;
  const quotation = data as SiteQuotationRow;

  const { data: itemRows, error: itemsError } = await supabase
    .from('site_quotation_items')
    .insert(
      input.items.map((item) => ({
        site_quotation_id: quotation.id,
        sl_no: item.slNo,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    )
    .select(QUOTATION_ITEM_COLUMNS);

  if (itemsError) throw itemsError;

  return mapQuotation(quotation, (itemRows ?? []).map((row) => mapQuotationItem(row as SiteQuotationItemRow)));
}

async function updateSiteQuotation(
  id: string,
  input: {
    title: string;
    customerAddress?: string | null;
    quoteDate: string;
    notes?: string | null;
    isPublished: boolean;
    items: Array<{ slNo: number; description: string; quantity: number; unitPrice: number }>;
  },
  userId: string,
): Promise<SiteQuotation> {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const { data, error } = await supabase
    .from('site_quotations')
    .update({
      title: input.title.trim(),
      customer_address: input.customerAddress?.trim() || null,
      quote_date: input.quoteDate,
      notes: input.notes?.trim() || null,
      subtotal,
      total: subtotal,
      is_published: input.isPublished,
      updated_by: userId,
    })
    .eq('id', id)
    .select(QUOTATION_COLUMNS)
    .single();

  if (error) throw error;
  const quotation = data as SiteQuotationRow;

  const { error: deleteError } = await supabase
    .from('site_quotation_items')
    .delete()
    .eq('site_quotation_id', id);

  if (deleteError) throw deleteError;

  const { data: itemRows, error: itemsError } = await supabase
    .from('site_quotation_items')
    .insert(
      input.items.map((item) => ({
        site_quotation_id: id,
        sl_no: item.slNo,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    )
    .select(QUOTATION_ITEM_COLUMNS);

  if (itemsError) throw itemsError;

  return mapQuotation(quotation, (itemRows ?? []).map((row) => mapQuotationItem(row as SiteQuotationItemRow)));
}

async function deleteSiteQuotation(id: string, userId: string) {
  const { error } = await supabase
    .from('site_quotations')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq('id', id);

  if (error) throw error;
}

export const siteContentService = {
  uploadSiteImage,
  listBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listShopCategories,
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
  listShopBrands,
  createShopBrand,
  updateShopBrand,
  deleteShopBrand,
  listShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  listSiteProjects,
  createSiteProject,
  updateSiteProject,
  deleteSiteProject,
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
  listSiteQuotations,
  createSiteQuotation,
  updateSiteQuotation,
  deleteSiteQuotation,
  getSettings,
  updateSettings,
};
