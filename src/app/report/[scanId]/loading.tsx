import { Skeleton } from "@/components/ui/Skeleton";

export default function ReportLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-10 py-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-[120px] w-[120px] rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="text-center">
        <Skeleton className="h-12 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto mt-2" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
      <div className="flex justify-center gap-3">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}
