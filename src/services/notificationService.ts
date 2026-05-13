import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/profileService';
import type { Notification } from '@/types/domain';

interface NotificationRow {
  id: string;
  company_id: string;
  title: string;
  message: string;
  created_by: string | null;
  created_at: string;
}

interface NotificationReadRow {
  notification_id: string;
  user_id: string;
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    message: row.message,
    createdBy: row.created_by,
    createdAt: row.created_at,
    isRead: false,
  };
}

async function listNotifications(userId: string, companyId?: string, limit = 30) {
  let query = supabase
    .from('notifications')
    .select('id, company_id, title, message, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const notifications = (data ?? []).map((row) => mapNotification(row as NotificationRow));
  const notificationIds = notifications.map((notification) => notification.id);

  const [{ data: reads, error: readsError }, profiles] = await Promise.all([
    notificationIds.length
      ? supabase
          .from('notification_reads')
          .select('notification_id, user_id')
          .eq('user_id', userId)
          .in('notification_id', notificationIds)
      : Promise.resolve({ data: [], error: null }),
    profileService.getProfilesByIds(
      notifications.map((notification) => notification.createdBy ?? ''),
    ),
  ]);

  if (readsError) {
    throw readsError;
  }

  const readLookup = new Set(
    (reads as NotificationReadRow[] | null)?.map((read) => read.notification_id) ?? [],
  );

  return notifications.map((notification) => ({
    ...notification,
    isRead: readLookup.has(notification.id),
    creator: notification.createdBy ? profiles[notification.createdBy] ?? null : null,
  }));
}

async function markAsRead(notificationId: string, userId: string) {
  const { error } = await supabase.from('notification_reads').upsert(
    {
      notification_id: notificationId,
      user_id: userId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'notification_id,user_id' },
  );

  if (error) {
    throw error;
  }
}

async function markAllAsRead(notificationIds: string[], userId: string) {
  if (notificationIds.length === 0) {
    return;
  }

  const { error } = await supabase.from('notification_reads').upsert(
    notificationIds.map((notificationId) => ({
      notification_id: notificationId,
      user_id: userId,
      read_at: new Date().toISOString(),
    })),
    { onConflict: 'notification_id,user_id' },
  );

  if (error) {
    throw error;
  }
}

function subscribeToNotifications(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('notifications-stream')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
      },
      callback,
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime notifications subscribed successfully');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime subscription error:', err);
      }
      if (status === 'TIMED_OUT') {
        console.warn('⚠️ Realtime subscription timed out');
      }
    });
  
  return channel;
}

export const notificationService = {
  listNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
};
