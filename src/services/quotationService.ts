import { supabase } from '@/lib/supabase';
import type { Quotation, QuotationFilters, QuotationItem } from '@/types/domain';

interface QuotationRow {
  id: string;
  company_id: string;
  est_id: string;
  customer_name: string;
  customer_address: string;
  quote_date: string;
  subtotal: number;
  total: number;
  status: 'pending' | 'approved';
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface QuotationItemRow {
  id: string;
  quotation_id: string;
  sl_no: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

function mapQuotation(row: QuotationRow): Quotation {
  return {
    id: row.id,
    companyId: row.company_id,
    estId: row.est_id,
    customerName: row.customer_name,
    customerAddress: row.customer_address,
    quoteDate: row.quote_date,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    status: row.status ?? 'pending',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapQuotationItem(row: QuotationItemRow): QuotationItem {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    slNo: row.sl_no,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
  };
}

async function listQuotations(
  companyId: string,
  filters?: QuotationFilters,
): Promise<Quotation[]> {
  let query = supabase
    .from('quotations')
    .select('id, company_id, est_id, customer_name, customer_address, quote_date, subtotal, total, status, created_by, created_at, updated_at, deleted_at')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (filters?.fromDate) {
    query = query.gte('quote_date', filters.fromDate);
  }

  if (filters?.toDate) {
    query = query.lte('quote_date', filters.toDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapQuotation(row as QuotationRow));
}

async function approveQuotation(quotationId: string): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .update({ status: 'approved' })
    .eq('id', quotationId);

  if (error) throw error;
}

async function deleteQuotation(quotationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId,
    })
    .eq('id', quotationId);

  if (error) throw error;
}

async function getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  const { data, error } = await supabase
    .from('quotation_items')
    .select('id, quotation_id, sl_no, description, quantity, unit_price, amount')
    .eq('quotation_id', quotationId)
    .order('sl_no', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapQuotationItem(row as QuotationItemRow));
}

async function createQuotation(input: {
  companyId: string;
  customerName: string;
  customerAddress: string;
  quoteDate: string;
  items: Array<{
    slNo: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}): Promise<Quotation> {
  const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);

  const { data, error } = await supabase.rpc('create_quotation', {
    p_company_id:       input.companyId,
    p_customer_name:    input.customerName,
    p_customer_address: input.customerAddress,
    p_quote_date:       input.quoteDate,
    p_subtotal:         subtotal,
    p_total:            subtotal,
    p_items:            input.items.map((item) => ({
      slNo:        item.slNo,
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      amount:      item.amount,
    })),
  });

  if (error) throw error;

  return mapQuotation(data as QuotationRow);
}

async function updateQuotation(
  quotationId: string,
  input: {
    customerName: string;
    customerAddress: string;
    quoteDate: string;
    items: Array<{
      slNo: number;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
  },
): Promise<Quotation> {
  const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);

  const { data, error } = await supabase.rpc('update_quotation', {
    p_quotation_id:     quotationId,
    p_customer_name:    input.customerName,
    p_customer_address: input.customerAddress,
    p_quote_date:       input.quoteDate,
    p_subtotal:         subtotal,
    p_total:            subtotal,
    p_items:            input.items.map((item) => ({
      slNo:        item.slNo,
      description: item.description,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      amount:      item.amount,
    })),
  });

  if (error) throw error;

  return mapQuotation(data as QuotationRow);
}

export const quotationService = {
  listQuotations,
  getQuotationItems,
  createQuotation,
  updateQuotation,
  approveQuotation,
  deleteQuotation,
};
