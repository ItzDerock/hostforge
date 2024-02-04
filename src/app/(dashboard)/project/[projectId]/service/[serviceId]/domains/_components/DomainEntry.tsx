"use client";

import { ArrowRight, CogIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { SimpleFormField } from "~/hooks/forms";

type FieldData = {
  domain: string;
  internalPort: number;
  https: boolean;
  forceSSL: boolean;
};

export default function DomainEntry({
  form,
  domains,
  field,
  index,
}: {
  form: UseFormReturn<
    {
      domains: FieldData[];
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    undefined
  >;

  domains: UseFieldArrayReturn<
    {
      domains: FieldData[];
    },
    "domains",
    "id"
  >;

  field: FieldData;
  index: number;
}) {
  const isOpen = useState(false);

  return (
    <Card className="flex flex-row gap-4 p-4">
      <SimpleFormField
        control={form.control}
        name={`domains.${index}.forceSSL`}
        friendlyName="HTTPS"
        render={({ field }) => (
          <div className="pt-2">
            <Switch {...field} className="mx-auto block" />
          </div>
        )}
      />

      <SimpleFormField
        control={form.control}
        name={`domains.${index}.domain`}
        friendlyName="Domain"
        className="flex-1"
      />

      <ArrowRight className="mt-9 flex-shrink-0" />

      <SimpleFormField
        control={form.control}
        name={`domains.${index}.internalPort`}
        friendlyName="Internal Port"
        className="w-60"
      />

      <div className="flex flex-row gap-2 pt-8">
        <Button variant="secondary" icon={CogIcon} className="mr-2" />

        <Button
          variant="destructive"
          icon={TrashIcon}
          onClick={() => domains.remove(index)}
        />
      </div>
    </Card>
  );
}
