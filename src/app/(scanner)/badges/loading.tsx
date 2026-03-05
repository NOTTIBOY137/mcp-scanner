import { Skeleton } from "@/components/ui/Skeleton";

export default function BadgesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-16">
      <div className="text-center space-y-3">
        <Skeleton className="h-9 w-80 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-52 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>
    </div>
  );
}
