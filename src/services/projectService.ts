import { supabase } from '@/lib/supabase';
import type { Project, ProjectItem } from '@/types/domain';

interface ProjectRow {
  id: string;
  company_id: string;
  quotation_id: string;
  est_id: string;
  customer_name: string;
  customer_address: string;
  quote_total: number;
  total_cost: number;
  profit_amount: number;
  profit_percentage: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectItemRow {
  id: string;
  project_id: string;
  sl_no: number;
  description: string;
  quantity: number;
  sale_price: number;
  cost_price: number;
  sale_amount: number;
  cost_amount: number;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    companyId: row.company_id,
    quotationId: row.quotation_id,
    estId: row.est_id,
    customerName: row.customer_name,
    customerAddress: row.customer_address,
    quoteTotal: Number(row.quote_total),
    totalCost: Number(row.total_cost),
    profitAmount: Number(row.profit_amount),
    profitPercentage: Number(row.profit_percentage),
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectItem(row: ProjectItemRow): ProjectItem {
  return {
    id: row.id,
    projectId: row.project_id,
    slNo: row.sl_no,
    description: row.description,
    quantity: Number(row.quantity),
    salePrice: Number(row.sale_price),
    costPrice: Number(row.cost_price),
    saleAmount: Number(row.sale_amount),
    costAmount: Number(row.cost_amount),
  };
}

async function listProjects(companyId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProject(row as ProjectRow));
}

async function createProject(input: {
  companyId: string;
  quotationId: string;
  estId: string;
  customerName: string;
  customerAddress: string;
  quoteTotal: number;
  totalCost: number;
  createdBy: string;
  items: Array<{
    slNo: number;
    description: string;
    quantity: number;
    salePrice: number;
    costPrice: number;
    saleAmount: number;
    costAmount: number;
  }>;
}): Promise<Project> {
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert({
      company_id: input.companyId,
      quotation_id: input.quotationId,
      est_id: input.estId,
      customer_name: input.customerName,
      customer_address: input.customerAddress,
      quote_total: input.quoteTotal,
      total_cost: input.totalCost,
      created_by: input.createdBy,
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (projectError) throw projectError;

  const project = mapProject(projectData as ProjectRow);

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('project_items').insert(
      input.items.map((item) => ({
        project_id: project.id,
        sl_no: item.slNo,
        description: item.description,
        quantity: item.quantity,
        sale_price: item.salePrice,
        cost_price: item.costPrice,
        sale_amount: item.saleAmount,
        cost_amount: item.costAmount,
      })),
    );

    if (itemsError) throw itemsError;
  }

  return project;
}

async function completeProject(projectId: string, updatedBy: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .eq('id', projectId);

  if (error) throw error;
}

export const projectService = {
  listProjects,
  createProject,
  completeProject,
};
