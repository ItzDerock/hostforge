import { api } from "~/trpc/server";

export default async function Test() {
  const user = await api.auth.me.query();

  return (
    <div>
      Logged in as {user.username} ({user.id})
    </div>
  );
}
