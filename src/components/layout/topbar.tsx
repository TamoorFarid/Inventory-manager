import { Menu } from 'lucide-react';

import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/80 bg-background/70 backdrop-blur-xl">
      {!env.isSupabaseConfigured ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase credentials are not configured yet. Add them to
          {' '}
          <code>.env.local</code>
          {' '}
          before signing in.
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button className="lg:hidden" onClick={onOpenSidebar} size="icon" variant="outline">
            <Menu className="size-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Live operations
            </p>
            <h2 className="font-display text-xl font-semibold tracking-tight text-slate-950">
              Inventory command center
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
