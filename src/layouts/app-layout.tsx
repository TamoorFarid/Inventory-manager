import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { toast } from 'sonner';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { companyService } from '@/services/companyService';
import { useAppStore } from '@/store/app-store';
import type { Company } from '@/types/domain';

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    companyService
      .listCompanies()
      .then(setCompanies)
      .catch((error) => {
        toast.error(getErrorMessage(error, 'Unable to load companies.'));
      });
  }, [profile]);

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(43,124,104,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_28%)]" />
      <div className="fixed inset-0 -z-10 bg-grid bg-[size:42px_42px] opacity-30" />
      <div className="flex min-h-screen">
        <div className="hidden w-[310px] lg:block">
          <Sidebar companies={companies} onLogout={signOut} profile={profile} />
        </div>

        <Sheet onOpenChange={setMobileSidebarOpen} open={mobileSidebarOpen}>
          <SheetContent className="p-0 lg:hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>App navigation and company quick links</SheetDescription>
            </SheetHeader>
            <Sidebar companies={companies} onLogout={signOut} profile={profile} />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
