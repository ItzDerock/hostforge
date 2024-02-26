"use client";

import { motion } from "framer-motion";
import { ArrowRight, CogIcon, TrashIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef } from "react";
import { useFormContext, type UseFieldArrayReturn } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { SimpleFormField } from "~/hooks/forms";
import { useProject } from "../../../../_context/ProjectContext";
import { type DomainsListForm } from "../DomainsList";

const DomainEntry = forwardRef<
  HTMLDivElement,
  {
    field: DomainsListForm["domains"][number] & {
      id: string; // react-hook-form adds this
    };
    index: number;
    domains: UseFieldArrayReturn<DomainsListForm, "domains", "id">;
  }
>(({ field, index, domains }, ref) => {
  const form = useFormContext();
  const router = useRouter();
  const pathname = usePathname();
  const project = useProject();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: 0.15,
      }}
      key={field.domainId ?? field.id}
      onAnimationComplete={(def) => {
        // https://github.com/orgs/react-hook-form/discussions/11379
        // this took me FOREVER to figure out
        // basically we need to re-remove the field if it's the last one (and it is exit animation)

        if (
          index === domains.fields.length - 1 &&
          // check if it's the exit animation
          typeof def !== "string" &&
          "opacity" in def &&
          def.opacity === 0
        ) {
          domains.remove(index);
        }
      }}
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
                const domains = pathname.trim().endsWith("/domains")
                  ? pathname.trim()
                  : pathname.replace(/\/[A-z0-9]*?$/, ``);

                console.log(`${domains}/${field.domainId ?? field.id}`);
                router.push(
                  `${project.servicePath}/domains/${
                    field.domainId ?? field.id
                  }`,
                );
              }}
            />

            <Button
              variant="destructive"
              type="button"
              icon={TrashIcon}
              onClick={() => {
                domains.remove(index);
              }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

DomainEntry.displayName = "DomainEntry";
export default DomainEntry;
