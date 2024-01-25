"use client";

import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Form } from "~/components/ui/form";
import { FormSubmit, SimpleFormField, useForm } from "~/hooks/forms";

const formValidator = z.object({
  domains: z.array(
    z.object({
      domain: z
        .string()
        .regex(
          /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/,
          { message: "Invalid domain name" },
        ),

      internalPort: z.number().int().min(1).max(65535),
      https: z.boolean(),
      forceSSL: z.boolean(),
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
    defaultValues: {},
  });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control,
      name: "domains",
    },
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          console.log(data);
        })}
        className="grid grid-cols-2 gap-4"
      >
        <h1 className="col-span-2">Domains</h1>

        {fields.map((field, index) => (
          <div className="flex gap-4" key={field.id}>
            <SimpleFormField
              control={form.control}
              name={`domains.${index}.domain`}
              friendlyName="Domain"
              required
              className="flex-1"
            />
          </div>
        ))}

        <FormSubmit form={form} className="col-span-2" />
      </form>
    </Form>
  );
}
