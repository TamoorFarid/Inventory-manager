import { Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CompanyPill({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        'gap-2 rounded-full bg-primary/8 px-3 py-1 text-primary hover:bg-primary/10',
        className,
      )}
    >
      <Building2 className="size-3.5" />
      {name}
    </Badge>
  );
}
