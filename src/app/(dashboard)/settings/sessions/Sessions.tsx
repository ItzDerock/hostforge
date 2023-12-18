import { Card } from "~/components/ui/card";
import UAParser from "ua-parser-js";
import { RelativeDate } from "~/components/RelativeDate";

type SessionData = {
  lastUA: string | null;
  lastIP: string | null;
  lastAccessed: Date | null;
  createdAt: number;
  id: string;
};

export default function Session(props: { session: SessionData }) {
  const ua = new UAParser(props.session.lastUA ?? "").getResult();

  return (
    <Card className="p-6">
      <p className="text-lg">
        <span className="font-black">{ua.os.name ?? ua.ua}</span>
        {ua.browser.name
          ? ua.browser.version
            ? ` ${ua.browser.name} v${ua.browser.version}`
            : ` ${ua.browser.name}`
          : null}
      </p>
      <p className="text-sm text-muted-foreground">
        {props.session.lastIP ?? <span className="italic">IP Unknown</span>}
        {" • "}
        {props.session.lastAccessed ? (
          <RelativeDate date={props.session.lastAccessed} />
        ) : (
          <span className="italic">Never accessed</span>
        )}
      </p>
    </Card>
  );
}
