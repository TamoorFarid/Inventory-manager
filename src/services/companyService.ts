import { supabase } from '@/lib/supabase';
import type { CompanyValues, MemberValues } from '@/lib/validators';
import { profileService } from '@/services/profileService';
import type { ActivityLog, Company, CompanyMember } from '@/types/domain';

interface CompanyRow {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CompanyMemberRow {
  id: string;
  company_id: string;
  user_id: string;
  added_by: string;
  removed_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ActivityLogRow {
  id: string;
  company_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function mapActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    description: row.description,
    actorId: row.actor_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    memberCount: 0,
    inventoryCount: 0,
    recentActivity: [],
  };
}

function mapCompanyMember(row: CompanyMemberRow): CompanyMember {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    addedBy: row.added_by,
    removedBy: row.removed_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function getCompanyActivity(companyId: string, limit = 5) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      'id, company_id, entity_type, entity_id, action, description, actor_id, metadata, created_at',
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const activities = (data ?? []).map((row) => mapActivityLog(row as ActivityLogRow));
  const profiles = await profileService.getProfilesByIds(
    activities.map((activity) => activity.actorId ?? ''),
  );

  return activities.map((activity) => ({
    ...activity,
    actor: activity.actorId ? profiles[activity.actorId] ?? null : null,
  }));
}

async function listCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select(
      'id, name, description, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const companies = (data ?? []).map((row) => mapCompany(row as CompanyRow));

  const profiles = await profileService.getProfilesByIds(
    companies.flatMap((company) => [company.createdBy, company.updatedBy ?? '']),
  );

  const enrichedCompanies = await Promise.all(
    companies.map(async (company) => {
      const [memberCountResult, inventoryCountResult, recentActivity] = await Promise.all([
        supabase
          .from('company_members')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .is('deleted_at', null),
        supabase
          .from('inventory_items')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .is('deleted_at', null),
        getCompanyActivity(company.id, 3),
      ]);

      if (memberCountResult.error) {
        throw memberCountResult.error;
      }

      if (inventoryCountResult.error) {
        throw inventoryCountResult.error;
      }

      return {
        ...company,
        memberCount: memberCountResult.count ?? 0,
        inventoryCount: inventoryCountResult.count ?? 0,
        recentActivity,
        createdByProfile: profiles[company.createdBy] ?? null,
        updatedByProfile: company.updatedBy ? profiles[company.updatedBy] ?? null : null,
      } satisfies Company;
    }),
  );

  return enrichedCompanies;
}

async function getCompanyById(companyId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select(
      'id, name, description, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (error) {
    throw error;
  }

  const company = mapCompany(data as CompanyRow);
  const profiles = await profileService.getProfilesByIds([
    company.createdBy,
    company.updatedBy ?? '',
  ]);
  const [members, inventoryCountResult, activity] = await Promise.all([
    getCompanyMembers(companyId),
    supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null),
    getCompanyActivity(companyId, 8),
  ]);

  if (inventoryCountResult.error) {
    throw inventoryCountResult.error;
  }

  return {
    ...company,
    memberCount: members.length,
    inventoryCount: inventoryCountResult.count ?? 0,
    recentActivity: activity,
    createdByProfile: profiles[company.createdBy] ?? null,
    updatedByProfile: company.updatedBy ? profiles[company.updatedBy] ?? null : null,
  } satisfies Company;
}

async function createCompany(values: CompanyValues, userId: string) {
  const payload = {
    name: values.name.trim(),
    description: values.description?.trim() || null,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from('companies')
    .insert(payload)
    .select(
      'id, name, description, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return mapCompany(data as CompanyRow);
}

async function updateCompany(companyId: string, values: CompanyValues, userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: values.name.trim(),
      description: values.description?.trim() || null,
      updated_by: userId,
    })
    .eq('id', companyId)
    .select(
      'id, name, description, created_by, updated_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .single();

  if (error) {
    throw error;
  }

  return mapCompany(data as CompanyRow);
}

async function archiveCompany(companyId: string, userId: string) {
  const { error } = await supabase
    .from('companies')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId,
    })
    .eq('id', companyId);

  if (error) {
    throw error;
  }
}

async function getCompanyMembers(companyId: string) {
  const { data, error } = await supabase
    .from('company_members')
    .select(
      'id, company_id, user_id, added_by, removed_by, deleted_by, created_at, updated_at, deleted_at',
    )
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const members = (data ?? []).map((row) => mapCompanyMember(row as CompanyMemberRow));
  const profiles = await profileService.getProfilesByIds(
    members.flatMap((member) => [member.userId, member.addedBy]),
  );

  return members.map((member) => ({
    ...member,
    profile: profiles[member.userId] ?? null,
    addedByProfile: profiles[member.addedBy] ?? null,
  }));
}

async function addMember(
  companyId: string,
  values: MemberValues,
  actorId: string,
  role: 'admin' | 'member' = 'member',
) {
  const { data, error } = await supabase.functions.invoke('create-member', {
    body: {
      companyId,
      email: values.email,
      username: values.username,
      password: values.password,
      role,
      actorId,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

async function removeMember(memberId: string, actorId: string) {
  const { error } = await supabase
    .from('company_members')
    .update({
      deleted_at: new Date().toISOString(),
      removed_by: actorId,
      deleted_by: actorId,
    })
    .eq('id', memberId);

  if (error) {
    throw error;
  }
}

export const companyService = {
  addMember,
  archiveCompany,
  createCompany,
  getCompanyActivity,
  getCompanyById,
  getCompanyMembers,
  listCompanies,
  removeMember,
  updateCompany,
};
