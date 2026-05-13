import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/empty-state';
import { LoadingGrid } from '@/components/shared/loading-state';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types/domain';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    if (!profile) {
      return;
    }

    setIsLoading(true);

    try {
      setNotifications(await notificationService.listNotifications(profile.id));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load notifications.'));
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useRealtimeNotifications({
    onRefresh: loadNotifications,
  });

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) =>
        filter === 'unread' ? !notification.isRead : true,
      ),
    [filter, notifications],
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    if (!profile) {
      return;
    }

    const previous = notifications;

    try {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      await notificationService.markAsRead(notificationId, profile.id);
    } catch (error) {
      setNotifications(previous);
      toast.error(getErrorMessage(error, 'Unable to update notification.'));
    }
  };

  const handleMarkAll = async () => {
    if (!profile) {
      return;
    }

    try {
      await notificationService.markAllAsRead(
        notifications.map((notification) => notification.id),
        profile.id,
      );
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      toast.success('Notifications marked as read.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to mark all notifications.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="See updates as they happen."
        eyebrow="Notifications"
        title="Activity feed"
        action={
          <Button onClick={() => void handleMarkAll()} variant="outline">
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        }
      />

      {isLoading ? (
        <LoadingGrid />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              helper="All your notifications."
              icon={Bell}
              title="Total notifications"
              value={notifications.length}
            />
            <MetricCard
              accent="from-chart-2/15 via-white to-chart-2/5"
              helper="Notifications you haven't read."
              icon={Bell}
              title="Unread"
              value={unreadCount}
            />
            <MetricCard
              accent="from-chart-3/15 via-white to-chart-3/5"
              helper="Admins see all, members see their companies."
              icon={CheckCheck}
              title="Access model"
              value={profile?.role === 'admin' ? 'Global' : 'Scoped'}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'default' : 'outline'}
            >
              Unread
            </Button>
          </div>

          {filteredNotifications.length === 0 ? (
            <EmptyState
              description="Notifications will appear here when sales are made."
              icon={Bell}
              title="No notifications in this view"
            />
          ) : (
            <div className="grid gap-4">
              {filteredNotifications.map((notification) => (
                <Card
                  className={!notification.isRead ? 'border-primary/15 bg-primary/5' : undefined}
                  key={notification.id}
                >
                  <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl font-semibold text-slate-950">
                          {notification.title}
                        </h3>
                        {!notification.isRead ? <Badge>Unread</Badge> : <Badge variant="outline">Read</Badge>}
                      </div>
                      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        <span>{notification.creator?.username ?? 'System'}</span>
                        <span>{formatRelativeTime(notification.createdAt)}</span>
                        <span>{formatDateTime(notification.createdAt)}</span>
                      </div>
                    </div>
                    {!notification.isRead ? (
                      <Button
                        onClick={() => void handleMarkAsRead(notification.id)}
                        variant="outline"
                      >
                        Mark as read
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
