import { Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-float">
        <Sparkles className="size-5" />
      </div>
      <div className="space-y-0.5">
        <p className="font-display text-lg font-semibold tracking-tight text-slate-900">
          Solar Inventory
        </p>
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Operations Hub
        </p>
      </div>
    </div>
  );
}
