import type { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/contexts/auth-context';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        expand
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'rounded-2xl border border-white/70 shadow-panel',
          },
        }}
      />
    </AuthProvider>
  );
}
