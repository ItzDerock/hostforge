"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { FormSubmit } from "~/hooks/forms";
import { api } from "~/trpc/react";
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

export default function DomainsList() {
  const service = useService();
  const updateDomain = api.projects.services.updateDomain.useMutation();
  const deleteDomain = api.projects.services.deleteDomain.useMutation();

  const form = useForm<z.infer<typeof formValidator>>({
    defaultValues: {
      domains: [],
    },

    resolver: zodResolver(formValidator),
  });

  const domainsForm = useFieldArray({
    control: form.control,
    name: "domains",
  });

  useEffect(() => {
    console.log("setting domains", service.data?.domains ?? []);
    form.setValue(
      "domains",
      service.data?.domains.map((d) => ({ ...d, domainId: d.id })) ?? [],
    );
  }, [form, service.data?.domains]);

  console.log(
    "Rendering fields with ids: ",
    domainsForm.fields.map((field) => field.id),
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await Promise.all([
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

          // refetch service
          await service.refetch();
        })}
        className="flex flex-col gap-4"
      >
        {/* Animations break react-hook-form, no tracking issue yet. */}
        {/* <AnimatePresence mode="sync"> */}

        <h1 key="title" className="col-span-2">
          Domains
        </h1>

        {domainsForm.fields.map((field, index) => (
          <DomainEntry
            field={field}
            index={index}
            key={field.id}
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
                domainId: undefined,
                domain: uuidv7().split("-").at(-1) + ".example.com",
                forceSSL: false,
                https: false,
                internalPort: 8080,
              };

              console.log("add domain: ", domain.domainId);

              domainsForm.append(domain);
            }}
          >
            Add Domain
          </Button>

          {/* <FormUnsavedChangesIndicator form={form} /> */}
        </motion.div>
        {/* </AnimatePresence> */}
      </form>
    </Form>
  );
}
