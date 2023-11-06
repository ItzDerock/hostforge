import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/server";
import Session from "./Sessions";

export default async function SessionsPage() {
  const sessions = await api.auth.sessions.list.query();

  return (
    <>
      {sessions.map((session, idx) => (
        <Session key={idx} session={session} />
      ))}
    </>
  );
}
