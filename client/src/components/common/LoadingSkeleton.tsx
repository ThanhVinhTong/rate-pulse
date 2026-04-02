import { LoadingSkeletonLayout } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  cards?: number;
}

export function LoadingSkeleton({ cards = 4 }: LoadingSkeletonProps) {
  return <LoadingSkeletonLayout cards={cards} />;
}
