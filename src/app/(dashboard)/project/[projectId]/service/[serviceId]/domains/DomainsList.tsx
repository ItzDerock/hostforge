"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { FormSubmit, FormUnsavedChangesIndicator } from "~/hooks/forms";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { useService } from "../_hooks/service";
import DomainEntry from "./_components/DomainEntry";

const formValidator = z.object({
  domains: z.array(
    z.object({
      domainId: z.string().optional(),
      domain: z
        .string()
        .regex(
          /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/,
          { message: "Invalid domain name" },
        ),

      internalPort: z.coerce.number().int().min(1).max(65535).default(8080),
      https: z.coerce.boolean().default(true),
      forceSSL: z.coerce.boolean().default(true),
    }),
  ),
});

export type DomainsListForm = z.infer<typeof formValidator>;

export default function DomainsList({
  defaultData,
  children,
}: {
  defaultData: RouterOutputs["projects"]["services"]["get"];
  children: ReactNode;
}) {
  const service = useService(undefined, defaultData);
  const updateDomain = api.projects.services.updateDomain.useMutation();
  const deleteDomain = api.projects.services.deleteDomain.useMutation();

  const form = useForm<z.infer<typeof formValidator>>({
    defaultValues: {
      domains: service.data?.domains.map((newDomain) => ({
        ...newDomain,
        domainId: newDomain.id,
        id: undefined,
      })),
    },

    resolver: zodResolver(formValidator),
  });

  const domainsForm = useFieldArray({
    control: form.control,
    name: "domains",
  });

  useEffect(() => {
    // reset the dirty state
    form.resetField("domains", {
      defaultValue:
        service.data?.domains.map((newDomain) => ({
          ...newDomain,
          domainId: newDomain.id,
        })) ?? [],
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.data]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          const results = await Promise.allSettled([
            ...data.domains.map((domain) => {
              if (service.data === undefined) return;

              return updateDomain.mutateAsync({
                projectId: service.data.projectId,
                serviceId: service.data.id,
                domainId: domain.domainId,
                domain: domain.domain,
                forceSSL: domain.forceSSL,
                https: domain.https,
                internalPort: domain.internalPort,
              });
            }),

            // domains that don't exist anymore
            ...(service.data?.domains
              .filter(
                (d) =>
                  !data.domains.some(
                    (existingDomain) => existingDomain.domainId === d.id,
                  ),
              )
              .map((domainToDelete) => {
                if (service.data === undefined) return;

                return deleteDomain.mutateAsync({
                  domainId: domainToDelete.id,
                  serviceId: service.data.id,
                  projectId: service.data.projectId,
                });
              }) ?? []),
          ]);

          // check if any of the promises failed
          const numFailed = results.filter(
            (r) => r.status === "rejected",
          ).length;
          if (numFailed > 0) {
            toast.error(`${numFailed} domains failed to update`);
            return;
          }

          // refetch service
          await service.refetch();
          toast.success("Domains updated");
        })}
        className="flex flex-col gap-4"
      >
        <AnimatePresence mode="sync" initial={false}>
          <h1 key="title" className="col-span-2">
            Domains
          </h1>

          {domainsForm.fields.map((field, index) => (
            <DomainEntry
              field={field}
              index={index}
              key={field.domainId ?? field.id}
              domains={domainsForm}
            />
          ))}

          <motion.div
            className="flex flex-row flex-wrap items-center gap-4"
            layout
            key={service.data?.id}
          >
            <FormSubmit
              form={form}
              className="col-span-2"
              hideUnsavedChangesIndicator
            />

            <Button
              type="button"
              variant="secondary"
              icon={PlusIcon}
              onClick={() => {
                const domain = {
                  domainId: uuidv7(),
                  domain: uuidv7().split("-").at(-1) + ".example.com",
                  forceSSL: false,
                  https: false,
                  internalPort: 8080,
                };

                domainsForm.append(domain);
              }}
            >
              Add Domain
            </Button>

            <FormUnsavedChangesIndicator />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>{children}</AnimatePresence>
      </form>
    </Form>
  );
}
