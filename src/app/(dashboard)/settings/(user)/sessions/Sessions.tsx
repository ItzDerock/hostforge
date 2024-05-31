"use client";

import { Card } from "~/components/ui/card";
import UAParser from "ua-parser-js";
import { RelativeDate } from "~/components/Date";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "sonner";

type SessionData = {
  lastUA: string | null;
  lastIP: string | null;
  lastAccessed: Date | null;
  createdAt: number;
  active: boolean;
};

export default function Session(props: { session: SessionData }) {
  const ua = new UAParser(props.session.lastUA ?? "").getResult();

  return (
    <Card className={"p-6 " + (props.session.active ? "border-accent" : "")}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger
            onClick={() => {
              // copy to clipboard
              navigator.clipboard
                .writeText(props.session.lastUA ?? "")
                .then(() => {
                  toast.success("Copied to clipboard");
                })
                .catch(() => {
                  toast.error("Failed to copy to clipboard");
                });
            }}
          >
            <p className="text-lg">
              <span className="font-black">{ua.os.name ?? ua.ua}</span>
              {ua.browser.name
                ? ua.browser.version
                  ? ` ${ua.browser.name} v${ua.browser.version}`
                  : ` ${ua.browser.name}`
                : null}

              {ua.device.type && (
                <span className="capitalize">
                  {" • "}
                  {ua.device.type}
                </span>
              )}

              {props.session.active ? (
                <span className="ml-1 text-sm text-primary"> You!</span>
              ) : null}
            </p>
          </TooltipTrigger>

          <TooltipContent>
            <pre>{props.session.lastUA}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
