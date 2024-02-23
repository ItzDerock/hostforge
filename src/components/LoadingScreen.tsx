import { CgSpinner } from "react-icons/cg";

export default function LoadingScreen() {
  return (
    <div className="flex h-full w-full flex-grow items-center justify-center align-middle">
      <div className="p-8 text-center">
        <CgSpinner className="flex-shrink animate-spin" size="24" />
        <div className="sr-only">Loading</div>
      </div>
    </div>
  );
}
