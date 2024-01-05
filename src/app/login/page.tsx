import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import LoginForm from "./Login";

export default async function LoginPage() {
  const loggedIn = await api.auth.me.query().catch(() => null);
  if (loggedIn) return redirect("/");

  return <LoginForm />;
}
