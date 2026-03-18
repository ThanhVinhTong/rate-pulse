interface LoadingSkeletonProps {
  cards?: number;
}

export function LoadingSkeleton({ cards = 4 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}
