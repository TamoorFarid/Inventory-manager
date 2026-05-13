import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl">
        <EmptyState
          actionLabel="Back to dashboard"
          description="This page does not exist."
          icon={Compass}
          onAction={() => {
            window.location.href = '/';
          }}
          title="Page not found"
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Or jump directly to
          {' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/">
            the dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
