import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/server";
import Session from "./Sessions";

export default async function SessionsPage() {
  // fake loading
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  const sessions = await api.auth.sessions.list.query();

  return (
    <>
      {sessions.map((session, idx) => (
        <Session key={idx} session={session} />
      ))}
    </>
  );
}
