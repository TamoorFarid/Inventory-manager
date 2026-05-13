import { Activity, ArrowRight, Boxes, Building2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import type { Company } from '@/types/domain';

interface CompanyCardProps {
  company: Company;
  actions?: React.ReactNode;
}

export function CompanyCard({ company, actions }: CompanyCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-white to-chart-2/10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-2 bg-white/80 text-primary">
              <Building2 className="size-3.5" />
              Company workspace
            </Badge>
            <div>
              <CardTitle className="text-2xl">{company.name}</CardTitle>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {company.description || 'No description added yet.'}
              </p>
            </div>
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            Members
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950">
            {company.memberCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Boxes className="size-4" />
            Inventory
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950">
            {company.inventoryCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Activity className="size-4" />
            Activity
          </div>
          <p className="text-sm font-medium text-slate-950">
            {company.recentActivity[0]?.description ?? 'No recent activity yet'}
          </p>
          {company.recentActivity[0] ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(company.recentActivity[0].createdAt)}
            </p>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Updated by {company.updatedByProfile?.username ?? company.createdByProfile?.username ?? 'system'}
        </div>
        <Button asChild variant="outline">
          <Link to={`/companies/${company.id}`}>
            Open workspace
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
