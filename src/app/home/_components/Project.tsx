import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FaServer } from "react-icons/fa6";

export function Project() {
  return (
    <section>
      <h1 className="text-lg">PLAUSIBLE</h1>

      <div className="flex flex-row flex-wrap">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-8 space-y-0 p-4 pb-2 align-top">
            <div>
              <CardTitle className="font-semibold uppercase">
                plausible
              </CardTitle>
              <p className="mb-auto mt-0 text-sm text-muted-foreground">APP</p>
            </div>
            <FaServer className="text-2xl text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4"></CardContent>

          <div className="m-2 mt-0">
            <div className="h-2 w-full rounded-full bg-green-600"></div>
          </div>
        </Card>
      </div>
    </section>
  );
}
