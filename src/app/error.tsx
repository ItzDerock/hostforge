"use client";

import { redirect } from "next/navigation";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // we cannot check if error is instance of TRPCClientError
  // because for some reason it doesn't work
  // so we check the stack
  if (
    error.stack &&
    error.stack.split("\n")[0] ===
    "TRPCClientError: You must be logged in to perform this action."
  ) {
    console.log("redirecting to login");
    return redirect("/login");
  }

  return (
    <div className="flex h-screen w-screen flex-col content-center justify-center text-center align-middle">
      <div className="m-8 mx-auto h-fit max-w-lg space-y-2">
        <h1 className="text-3xl font-bold">Error</h1>

        {error.message.includes("connect ENOENT /var/run/docker.sock") ? (
          <Card className="p-4">
            <h2>Docker is not running on the server.</h2>
            <p className="text-sm">
              Please start the Docker daemon and reload the page.
            </p>
          </Card>
        ) : error.message.includes("This node is not a swarm manager.") ? (
          <Card className="p-4">
            <h2>Docker is not running in swarm mode.</h2>
            <p className="text-sm">
              Check our wiki for instructions on how to resolve this issue.
            </p>
          </Card>
        ) : (
          <h2>
            An unexpected error has occured: <br /> {error.message}
          </h2>
        )}

        {/* show stacktrace if development */}
        {process && process.env.NODE_ENV === "development" && (
          <pre className="bg-background/9 overflow-x-auto rounded-md border-2 border-border p-4 text-left text-sm">
            {error.stack}
          </pre>
        )}

        <p className="text-sm">{error.digest}</p>

        <div className="flex flex-row justify-center gap-2">
          <Button onClick={reset}>Reload</Button>

          <a
            href="https://github.com/ItzDerock/hostforge/issues/new"
            className={buttonVariants({ variant: "secondary" })}
          >
            Report issue
          </a>
        </div>
      </div>
    </div>
  );
}
