import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-8 w-[40px]" />
                </CardContent>
            </Card>
        ))}
      </div>

      {/* Main Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
             <Card key={i} className="h-[140px]">
                <CardHeader>
                    <Skeleton className="h-5 w-[120px]" />
                </CardHeader>
                <CardContent className="space-y-2">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-[100px]" />
                </CardContent>
             </Card>
        ))}
      </div>
    </div>
  );
}