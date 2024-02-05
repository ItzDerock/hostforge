"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CogIcon, TrashIcon } from "lucide-react";
import { forwardRef, useState } from "react";
import { type UseFieldArrayReturn, type UseFormReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { SimpleFormField } from "~/hooks/forms";

type FieldData = {
  domainId: string;
  domain: string;
  internalPort: number;
  https: boolean;
  forceSSL: boolean;
};

const DomainEntry = forwardRef<
  HTMLDivElement,
  {
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
  }
>(({ form, domains, field, index }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: 0.4,
        type: "spring",
      }}
      key={field.domainId}
    >
      <Card className="p-4">
        <h1>
          Rendering {field.domainId ?? "undefined???"} at index {index}
        </h1>

        <div className="flex flex-row gap-4">
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
            <Button
              variant="secondary"
              icon={CogIcon}
              className="mr-2"
              onClick={() => {
                setIsOpen(!isOpen);
              }}
            />

            <Button
              variant="destructive"
              icon={TrashIcon}
              onClick={() => {
                domains.remove(index);
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div className="flex flex-col gap-4">
              <SimpleFormField
                control={form.control}
                name={`domains.${index}.https`}
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

              <SimpleFormField
                control={form.control}
                name={`domains.${index}.internalPort`}
                friendlyName="Internal Port"
                className="w-60"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

DomainEntry.displayName = "DomainEntry";
export default DomainEntry;
