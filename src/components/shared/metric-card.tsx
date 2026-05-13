import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCompactNumber } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  accent?: string;
  format?: 'compact' | 'plain';
}

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent = 'from-primary/15 via-primary/10 to-primary/5',
  format = 'plain',
}: MetricCardProps) {
  const displayValue =
    typeof value === 'number' && format === 'compact'
      ? formatCompactNumber(value)
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={cn('h-full overflow-hidden bg-white/95')}>
        <CardContent className="flex h-full flex-col p-0">
          <div className={cn('bg-gradient-to-br p-6', accent)}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {title}
                </p>
                <p className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  {displayValue}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
                <Icon className="size-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="flex-1 px-6 pb-6 pt-4">
            <p className="text-sm leading-6 text-muted-foreground">{helper}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
