import { Card } from "~/components/ui/card";
import UAParser from "ua-parser-js";

type SessionData = {
  lastUA: string | null;
  lastIP: string | null;
  lastAccessed: Date | null;
  createdAt: number;
  id: string;
};

export default function Session(props: { session: SessionData }) {
  const ua = new UAParser(props.session.lastUA ?? "");

  return (
    <Card className="p-6">
      <p className="text-lg font-bold">{ua.getBrowser().name}</p>
      <p className="text-sm text-muted-foreground">
        {ua.getOS().name} {ua.getOS().version}
      </p>
    </Card>
  );
}
