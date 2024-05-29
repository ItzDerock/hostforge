import { api } from "~/trpc/server";
import { SetupForm } from "./SetupForm";
import { redirect } from "next/navigation";

export default async function SetupInstance() {
  const isSetup = await api.setup.status.query();
  if (isSetup.setup) return redirect("/");

  return <SetupForm />;
}
