"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CogIcon, TrashIcon } from "lucide-react";
import { forwardRef, useState } from "react";
import { useFormContext, type UseFieldArrayReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { SimpleFormField } from "~/hooks/forms";
import { type DomainsListForm } from "../DomainsList";

type FieldData = {
  id: string; // internal ID for react-form-hook
  domainId: string;
  domain: string;
  internalPort: number;
  https: boolean;
  forceSSL: boolean;
};

const DomainEntry = forwardRef<
  HTMLDivElement,
  {
    field: FieldData;
    index: number;
    domains: UseFieldArrayReturn<DomainsListForm, "domains", "id">;
  }
>(({ field, index, domains }, ref) => {
  const form = useFormContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      ref={ref}
      // layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: 0.15,
      }}
      key={field.domainId}
    >
      <Card className="p-4">
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
              type="button"
              icon={CogIcon}
              className="mr-2"
              onClick={() => {
                setIsOpen(!isOpen);
              }}
            />

            <Button
              variant="destructive"
              type="button"
              icon={TrashIcon}
              onClick={() => {
                console.log("remove domain: ", field.domainId);
                domains.remove(index);
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div className="mt-4 grid grid-cols-2 rounded-md bg-background p-8">
              <h1 className="col-span-2 pb-4">Advanced Settings</h1>

              <SimpleFormField
                control={form.control}
                name={`domains.${index}.forceSSL`}
                friendlyName="Force SSL"
                render={({ field }) => (
                  <div className="pt-2">
                    <Switch {...field} className="mr-auto block" />
                  </div>
                )}
              />

              {/* TODO: allow custom SSL certificates */}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

DomainEntry.displayName = "DomainEntry";
export default DomainEntry;
