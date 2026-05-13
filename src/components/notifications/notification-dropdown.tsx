import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { getErrorMessage } from '@/lib/errors';
import { formatRelativeTime } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types/domain';

export function NotificationDropdown() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!profile) {
      return;
    }

    const nextNotifications = await notificationService.listNotifications(profile.id, undefined, 8);
    setNotifications(nextNotifications);
    setIsLoading(false);
  }, [profile]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useRealtimeNotifications({
    onRefresh: loadNotifications,
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const handleMarkAsRead = async (notificationId: string) => {
    if (!profile) {
      return;
    }

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
      toast.error(getErrorMessage(error, 'Unable to update notification.'));
      await loadNotifications();
    }
  };

  const handleMarkAll = async () => {
    if (!profile) {
      return;
    }

    try {
      const unreadIds = notifications
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id);

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      await notificationService.markAllAsRead(unreadIds, profile.id);
      toast.success('Notifications marked as read.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to mark notifications as read.'));
      await loadNotifications();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative" size="icon" variant="outline">
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 size-5 items-center justify-center rounded-full p-0 text-[10px]">
              {unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <DropdownMenuLabel className="px-0 py-0 text-foreground">
              Notifications
            </DropdownMenuLabel>
            <p className="text-xs text-muted-foreground">
              Live sales and inventory activity
            </p>
          </div>
          <Button onClick={handleMarkAll} size="sm" variant="ghost">
            <CheckCheck className="size-4" />
            Mark all
          </Button>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[360px]">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2 p-2 text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No notifications yet. Sales activity will appear here.
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  className="items-start gap-3 rounded-2xl p-3"
                  key={notification.id}
                  onClick={() => void handleMarkAsRead(notification.id)}
                >
                  <Avatar className="mt-0.5 size-9">
                    <AvatarFallback>
                      {notification.creator?.username?.slice(0, 2).toUpperCase() ?? 'SP'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-medium text-foreground">
                        {notification.title}
                      </p>
                      {!notification.isRead ? (
                        <span className="mt-1 size-2 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
