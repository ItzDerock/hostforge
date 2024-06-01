"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h2 className="text-4xl font-bold">Page Not Found</h2>
      <p className="mt-2 text-lg text-muted-foreground">
        Oops, looks like you&apos;ve followed a broken link or entered a URL
        that doesn&apos;t exist.
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          router.push("/");
        }}
      >
        Go back home
      </Button>
    </div>
  );
}
