import { AlertTriangle } from "lucide-react";

export function MissingData() {
  return (
    <div className="mr-4 rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
      <AlertTriangle className="mr-2 inline-block" size={20} />
      <h2 className="inline-block">Missing Data</h2>
    </div>
  );
}
