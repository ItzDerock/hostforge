"use client";

import { PlusIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import {
  FormSubmit,
  FormUnsavedChangesIndicator,
  useForm,
} from "~/hooks/forms";
import DomainEntry from "./_components/DomainEntry";

const formValidator = z.object({
  domains: z.array(
    z.object({
      domain: z
        .string()
        .regex(
          /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/,
          { message: "Invalid domain name" },
        ),

      internalPort: z.coerce.number().int().min(1).max(65535).default(8080),
      https: z.boolean().default(true),
      forceSSL: z.boolean().default(true),
    }),
  ),
});

export default function DomainsList(
  {
    // service,
  }: {
    // service: RouterOutputs["projects"]["services"]["get"];
  },
) {
  const form = useForm(formValidator, {
    defaultValues: {
      domains: [],
    },
  });
  const domainsForm = useFieldArray({
    control: form.control,
    name: "domains",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          console.log(data);
        })}
        className="flex flex-col gap-4"
      >
        <h1 className="col-span-2">Domains</h1>

        {domainsForm.fields.map((field, index) => (
          <DomainEntry
            form={form}
            domains={domainsForm}
            field={field}
            index={index}
            key={field.id}
          />
        ))}

        <div className="flex flex-row flex-wrap items-center gap-4">
          <FormSubmit
            form={form}
            className="col-span-2"
            hideUnsavedChangesIndicator
          />

          <Button
            variant="secondary"
            icon={PlusIcon}
            onClick={() =>
              domainsForm.append({
                domain: "",
                forceSSL: false,
                https: false,
                internalPort: 8080,
              })
            }
          >
            Add Domain
          </Button>

          <FormUnsavedChangesIndicator form={form} />
        </div>
      </form>
    </Form>
  );
}
