import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-0">
      <section className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 text-center -mx-6 -mt-8 px-6">
        <Skeleton className="h-14 w-96 max-w-full rounded-xl" />
        <Skeleton className="h-6 w-[540px] max-w-full" />
        <Skeleton className="h-14 w-full max-w-2xl rounded-xl mt-4" />
      </section>
      <section className="-mx-6 border-y border-[var(--border-subtle)] px-6 py-10">
        <div className="flex justify-center gap-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-8 w-20 mx-auto" />
              <Skeleton className="h-3 w-28 mx-auto" />
            </div>
          ))}
        </div>
      </section>
      <section className="pt-16 space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
