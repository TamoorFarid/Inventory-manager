import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-float">
        {/* If you have logo.png in public folder, it will display */}
        {/* Otherwise, you can replace this with your actual logo */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/90">
          <div className="text-center">
            <div className="text-xs font-bold leading-tight text-primary">SUN</div>
            <div className="text-[0.5rem] font-semibold leading-none text-primary/80">PULSE</div>
          </div>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="font-display text-lg font-semibold tracking-tight text-slate-900">
          SunPulse
        </p>
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Solar Energy
        </p>
      </div>
    </div>
  );
}
