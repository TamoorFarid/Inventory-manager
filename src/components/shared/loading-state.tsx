import { Skeleton } from '@/components/ui/skeleton';

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel"
          key={index}
        >
          <Skeleton className="mb-5 h-4 w-24" />
          <Skeleton className="mb-3 h-10 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function LoadingTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <Skeleton className="h-5 w-44" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton className="h-12 w-full" key={index} />
      ))}
    </div>
  );
}
