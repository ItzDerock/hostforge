import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { api } from "~/trpc/server";
import LoginForm from "./Login";

export default async function LoginPage() {
  const loggedIn = await api.auth.me.query().catch(() => null);
  if (loggedIn) return redirect("/");

  // check if instance is set up or not
  const isSetup = await db
    .select({ id: users.id })
    .from(users)
    .limit(1)
    .execute()
    .then((users) => users.length > 0);

  if (!isSetup) {
    return redirect("/setup");
  }

  return <LoginForm />;
}
