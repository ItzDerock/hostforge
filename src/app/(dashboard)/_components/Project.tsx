import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FaServer } from "react-icons/fa6";
import { Service } from "./Service";

export function Project() {
  return (
    <Card>
      {/* 
      Card header contains:
      - Project name
      - Project health
      - Basic project stats 
      */}
      <CardHeader className="flex flex-row flex-wrap justify-between">
        {/* Name and health */}
        <div>
          <CardTitle className="font-semibold">Plausible</CardTitle>
          <p className="mb-auto mt-0 text-sm text-muted-foreground">
            3/3 - Healthy
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-row gap-2 text-center">
          {/* CPU */}
          <div>
            <CardTitle>CPU</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>

          {/* Memory */}
          <div>
            <CardTitle>MEM</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>

          {/* Disk */}
          <div>
            <CardTitle>DISK</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-row flex-wrap justify-center gap-4">
          <Service />
          <Service />
          <Service />
        </div>
      </CardContent>
    </Card>
  );
}
