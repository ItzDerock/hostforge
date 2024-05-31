"use client";

export default function ErrorPage({ error }: { error: Error }) {
  if (
    error.message?.includes("Service not found or insufficient permissions")
  ) {
    return (
      <div className="mx-auto w-fit px-8 py-16 text-center">
        <h1 className="text-lg">Unknown Service</h1>
        <p className="text-muted-foreground">
          The service you are trying to access does not exist or you do not have
          permission to access it.
        </p>
      </div>
    );
  }

  throw error;
}
