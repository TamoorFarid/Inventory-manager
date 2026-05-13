import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { LoginValues } from '@/lib/validators';
import { profileService } from '@/services/profileService';

async function signIn(values: LoginValues) {
  const { data, error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    throw error;
  }

  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

async function getCurrentProfile(session: Session | null) {
  if (!session?.user) {
    return null;
  }

  return profileService.getProfileById(session.user.id);
}

function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}

export const authService = {
  getCurrentProfile,
  getSession,
  onAuthStateChange,
  signIn,
  signOut,
};
