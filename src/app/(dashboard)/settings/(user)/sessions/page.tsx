import { api } from "~/trpc/server";
import Session from "./Sessions";

export default async function SessionsPage() {
  const sessions = await api.auth.sessions.list.query();

  return (
    <section className="space-y-2">
      {sessions.map((session, idx) => (
        <Session key={idx} session={session} />
      ))}
    </section>
  );
}
