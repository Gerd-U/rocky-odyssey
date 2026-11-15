interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse bg-night-800 ${className}`} />;
}