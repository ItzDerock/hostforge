import { CgSpinner } from "react-icons/cg";

export function LoadingSpinner() {
  return (
    <div>
      <CgSpinner className="flex-shrink animate-spin" size="24" />
      <div className="sr-only">Loading</div>
    </div>
  );
}
