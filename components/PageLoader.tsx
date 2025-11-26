import { Skeleton } from "@/components/ui/skeleton";

export function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Generic Grid Layout (Works for Cards, Inputs, etc) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
           <div key={i} className="h-[200px] bg-slate-100 rounded-xl border border-slate-200 p-6 space-y-4">
               <div className="flex justify-between">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <Skeleton className="h-4 w-4" />
               </div>
               <Skeleton className="h-4 w-3/4" />
               <Skeleton className="h-4 w-1/2" />
               <div className="pt-4">
                  <Skeleton className="h-8 w-full rounded-md" />
               </div>
           </div>
        ))}
      </div>
    </div>
  );
}