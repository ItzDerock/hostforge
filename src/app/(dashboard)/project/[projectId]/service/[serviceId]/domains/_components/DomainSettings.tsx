"use client";

import { useEffect, useMemo } from "react";
import { Switch } from "~/components/ui/switch";
import { SimpleFormField } from "~/hooks/forms";
import type { DomainsListForm } from "./DomainsList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { StringParam, useQueryParam } from "use-query-params";
import type { UseFormReturn } from "react-hook-form";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "~/components/ui/form";

export function DomainSettings({
  form,
}: {
  form: UseFormReturn<DomainsListForm>;
}) {
  const [selected, setSelected] = useQueryParam("domainId", StringParam);

  const index = useMemo(
    () =>
      !!selected
        ? form.getValues("domains").findIndex(
            (domain) =>
              domain.domainId === selected ||
              // @ts-expect-error this exists
              domain.id === selected,
          )
        : null,
    [form, selected],
  );

  return (
    <Sheet
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) {
          setSelected(undefined);
        }
      }}
    >
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Domain</SheetTitle>
          <SheetDescription>
            Make advanced changes to the reverse-proxy configuration for this
            domain. Hit the save button on the main page to apply changes.
            Reloading will cause you to lose unsaved edits.
          </SheetDescription>
        </SheetHeader>

        {index !== null && (
          <FormItem>
            <FormLabel>Force HTTPS</FormLabel>
            <FormControl>
              <Switch
                className="my-4 block"
                checked={form.watch(`domains.${index}.forceSSL`)}
                onCheckedChange={(checked) => {
                  form.setValue(`domains.${index}.forceSSL`, checked, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              />
            </FormControl>
            <FormDescription>
              Automatically redirects all HTTP requests to HTTPS. Recommended by
              default. Redirects will go to the same page using the same domain
              and all query paramters will be preserved.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      </SheetContent>
    </Sheet>
  );
}
