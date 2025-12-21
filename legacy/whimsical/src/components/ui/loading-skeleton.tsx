import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'map' | 'stats' | 'text' | 'avatar';
}

export function LoadingSkeleton({ className, variant = 'default' }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={cn('animate-pulse rounded-xl bg-card border border-border p-6', className)}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="h-3 bg-muted rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (variant === 'map') {
    return (
      <div className={cn('animate-pulse rounded-xl bg-card border border-border overflow-hidden', className)}>
        <div className="w-full h-full min-h-[400px] bg-muted flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted-foreground/10 mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="h-3 bg-muted-foreground/10 rounded w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={cn('animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="h-8 bg-muted rounded w-20 mb-2" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('animate-pulse flex items-center gap-3', className)}>
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-2 bg-muted rounded w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('animate-pulse h-4 bg-muted rounded', className)} />
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 bg-muted rounded w-32 animate-pulse" />
            <div className="h-3 bg-muted rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-24 h-9 bg-muted rounded-full animate-pulse" />
          <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoadingSkeleton variant="map" className="h-[500px]" />
        </div>
        <div className="space-y-4">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      </div>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Stats row */}
      <LoadingSkeleton variant="stats" />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton variant="card" className="h-[300px]" />
        <LoadingSkeleton variant="card" className="h-[300px]" />
      </div>

      {/* Table/list skeleton */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
            </div>
            <div className="w-20 h-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
