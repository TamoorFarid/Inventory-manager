import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-white/80">
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="rounded-3xl bg-primary/10 p-4 text-primary">
          <Icon className="size-7" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold text-slate-950">{title}</h3>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
