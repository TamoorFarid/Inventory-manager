import { useEffect } from 'react';
import { toast } from 'sonner';

import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/use-auth';

interface UseRealtimeNotificationsOptions {
  onRefresh: () => Promise<void> | void;
}

export function useRealtimeNotifications({
  onRefresh,
}: UseRealtimeNotificationsOptions) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let channel: ReturnType<typeof notificationService.subscribeToNotifications> | null = null;

    try {
      channel = notificationService.subscribeToNotifications(() => {
        toast.info('A new inventory notification just arrived.');
        void onRefresh();
      });
    } catch (error) {
      console.error('Failed to subscribe to realtime notifications:', error);
      // Silently fail - app will still work without realtime updates
    }

    return () => {
      if (channel) {
        try {
          void channel.unsubscribe();
        } catch (error) {
          console.error('Failed to unsubscribe from realtime notifications:', error);
        }
      }
    };
  }, [isAuthenticated, onRefresh]);
}
