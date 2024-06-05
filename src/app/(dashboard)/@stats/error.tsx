"use client";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default function StatError({ reset }: { reset: () => void }) {
  return (
    <Card className="h-36 p-4 text-center">
      <h1 className="text-lg">Stat Error</h1>
      <p className="text-muted-foreground">
        There was an error loading the stat. Please try again later.
      </p>
      <Button
        className="mt-4"
        variant="outline"
        onClick={() => {
          reset();
        }}
      >
        Retry
      </Button>
    </Card>
  );
}
