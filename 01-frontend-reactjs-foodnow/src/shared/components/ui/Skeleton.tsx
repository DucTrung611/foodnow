type SkeletonProps = {
  className?: string;
  count?: number;
};

export function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`animate-pulse rounded-ticket bg-muted-border ${className}`} />
      ))}
    </>
  );
}
