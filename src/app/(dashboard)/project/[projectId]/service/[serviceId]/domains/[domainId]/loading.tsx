import { CgSpinner } from "react-icons/cg";

export default function DomainSlideLoading() {
  return (
    <div className="flex min-h-24 w-full items-center justify-center">
      <CgSpinner className="flex-shrink animate-spin" size="24" />
    </div>
  );
}
