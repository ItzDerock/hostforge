import { Card, CardContent, CardTitle } from "~/components/ui/card";

export function Service() {
  return (
    <Card>
      <CardTitle className="my-2 ml-4 mr-2 flex w-48 flex-row items-stretch justify-between">
        <div>
          <CardTitle>Plausible</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">APP</p>
          {/* <p className="mb-auto mt-0 text-sm text-muted-foreground">
            3/3 - Healthy
          </p> */}
        </div>

        <div className="w-1 rounded-md bg-green-600">
          <div className="sr-only">Healthy</div>
        </div>
      </CardTitle>
    </Card>
  );
}
