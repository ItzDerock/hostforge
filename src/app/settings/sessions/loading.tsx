import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

function LoadingCard() {
  return (
    <Card className="animate-pulse p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </Card>
  );
}

export default function SessionsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}
