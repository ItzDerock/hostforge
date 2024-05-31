"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function ErrorPage({ error }: { error: Error }) {
  if (
    error.message?.includes("Project not found or insufficient permissions")
  ) {
    return (
      <div className="mx-auto w-fit px-8 py-16 text-center">
        <h1 className="text-lg">Unknown Project</h1>
        <p className="text-muted-foreground">
          The project you are trying to access does not exist or you do not have
          permission to access it.
        </p>

        <Button className="mt-4" variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  throw error;
}
