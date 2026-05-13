import { supabase } from '@/lib/supabase';
import type { Profile, ProfileSummary, Role } from '@/types/domain';

interface ProfileRow {
  id: string;
  email: string;
  username: string;
  role: Role;
  created_at: string;
}

function mapProfileSummary(row: ProfileRow): ProfileSummary {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    ...mapProfileSummary(row),
    createdAt: row.created_at,
  };
}

async function getProfilesByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return {} satisfies Record<string, ProfileSummary>;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, role, created_at')
    .in('id', uniqueIds);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, ProfileSummary>>((accumulator, row) => {
    accumulator[row.id] = mapProfileSummary(row as ProfileRow);
    return accumulator;
  }, {});
}

async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, role, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw error;
  }

  return mapProfile(data as ProfileRow);
}

export const profileService = {
  getProfileById,
  getProfilesByIds,
  mapProfileSummary,
};
