export function NoDeployments() {
  return (
    <div className="mt-4 flex flex-col items-center justify-center space-y-2">
      <h2 className="text-2xl font-bold">No deployments yet</h2>
      <p className="text-muted-foreground">
        Configure your service, then hit the Deploy Changes button to deploy.
      </p>
    </div>
  );
}
