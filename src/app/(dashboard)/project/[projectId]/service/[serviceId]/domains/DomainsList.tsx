"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import {
  FormSubmit,
  FormUnsavedChangesIndicator,
  useForm,
} from "~/hooks/forms";
import { api } from "~/trpc/react";
import { useService } from "../_hooks/service";
import DomainEntry from "./_components/DomainEntry";

const formValidator = z.object({
  domains: z.array(
    z.object({
      domainId: z.string(),
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

export default function DomainsList() {
  const service = useService();
  const updateDomain = api.projects.services.updateDomain.useMutation();

  const form = useForm(formValidator, {
    defaultValues: {
      domains: [],
    },
  });

  const domainsForm = useFieldArray({
    control: form.control,
    name: "domains",
  });

  // useEffect(() => {
  //   console.log("setting domains", service.data?.domains ?? []);
  //   form.setValue("domains", service.data?.domains ?? []);
  // }, [service.data?.domains]);

  console.log(
    "Rendering fields with ids: ",
    domainsForm.fields.map((field) => field.id),
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          // await Promise.all(
          //   data.domains.map((domain) => {
          //     if (service.data === undefined) return;

          //     return updateDomain.mutateAsync({
          //       projectId: service.data.projectId,
          //       serviceId: service.data.id,
          //       domain: domain.domain,
          //       forceSSL: domain.forceSSL,
          //       https: domain.https,
          //       internalPort: domain.internalPort,
          //     });
          // }),
          // );

          // refetch service
          await service.refetch();
        })}
        className="flex flex-col gap-4"
      >
        <h1 className="col-span-2">Domains</h1>

        <AnimatePresence mode="sync">
          {domainsForm.fields.map((field, index) => (
            <DomainEntry
              form={form}
              domains={domainsForm}
              field={field}
              index={index}
              key={field.id}
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
              variant="secondary"
              icon={PlusIcon}
              onClick={() => {
                const domain = {
                  domainId: new Date().toISOString(),
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

            <FormUnsavedChangesIndicator form={form} />
          </motion.div>
        </AnimatePresence>
      </form>
    </Form>
  );
}
