"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Switch } from "~/components/ui/switch";
import { SimpleFormField } from "~/hooks/forms";
import { type DomainsListForm } from "../DomainsList";

export default function DomainPage() {
  const form = useFormContext<DomainsListForm>();
  const domainId = useSelectedLayoutSegment();

  const index = useMemo(
    () =>
      form.getValues("domains").findIndex(
        (domain) =>
          domain.domainId === domainId ||
          // @ts-expect-error this exists
          domain.id === domainId,
      ),
    [form, domainId],
  );

  return (
    <div className="flex flex-col gap-4 pt-4">
      <SimpleFormField
        control={form.control}
        friendlyName="Force HTTPS"
        description={
          <>
            Automatically redirects all HTTP requests to HTTPS. Recommended by
            default. Redirects will go to the same page using the same domain
            and all query paramters will be preserved.
          </>
        }
        name={`domains.${index}.forceSSL`}
        render={({ field }) => <Switch {...field} className="my-4 block" />}
      />
    </div>
  );
}
