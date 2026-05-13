import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, ChevronRight, LogOut } from 'lucide-react';

import { AppLogo } from '@/components/shared/app-logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Company, Profile } from '@/types/domain';

interface SidebarProps {
  companies: Company[];
  onLogout: () => Promise<void>;
  profile: Profile;
}

export function Sidebar({ companies, onLogout, profile }: SidebarProps) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    await onLogout();
    setLogoutDialogOpen(false);
  };

  return (
    <aside className="flex h-full flex-col border-r border-white/80 bg-white/80 px-4 py-5 backdrop-blur-xl">
      <AppLogo className="px-2" />
      <div className="mt-8 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-primary/6 hover:text-slate-950',
                isActive && 'bg-primary/8 text-slate-950 shadow-sm',
              )
            }
            key={item.href}
            to={item.href}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between px-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Companies
          </p>
          <p className="text-xs text-muted-foreground">Centralized access</p>
        </div>
        <Badge variant="outline">{companies.length}</Badge>
      </div>

      <ScrollArea className="mt-3 flex-1 pr-2">
        <div className="space-y-2">
          {companies.map((company) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 transition hover:border-primary/10 hover:bg-primary/5',
                  isActive && 'border-primary/15 bg-primary/8',
                )
              }
              key={company.id}
              to={`/companies/${company.id}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {company.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {company.inventoryCount} items
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </NavLink>
          ))}
          {companies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No company access yet.
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="mt-6 rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-slate-50 to-primary/5 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {profile.username}
            </p>
            <p className="truncate text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {profile.role}
            </p>
          </div>
        </div>
        <Button className="w-full" onClick={() => setLogoutDialogOpen(true)} variant="outline">
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>

      <AlertDialog onOpenChange={setLogoutDialogOpen} open={logoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleLogout()}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
