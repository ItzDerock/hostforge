import { api } from "~/trpc/server";
import LoginForm from "./Login";
import { redirect } from "next/navigation";

export default async function Home() {
  // if logged in already, redirect to dashboard
  const userData = await api.auth.me.query().catch((err) => null);
  if (userData) {
    redirect("/home");
  }

  return (
    <div className="flex h-screen flex-col justify-center align-middle">
      <LoginForm />
    </div>
  );
}
