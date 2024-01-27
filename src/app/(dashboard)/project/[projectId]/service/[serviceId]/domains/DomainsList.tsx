"use client";

import { ArrowRight, PlusIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  FormSubmit,
  FormUnsavedChangesIndicator,
  SimpleFormField,
  useForm,
} from "~/hooks/forms";

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
          <div className="flex flex-row gap-4" key={field.id}>
            <FormField
              control={form.control}
              name={`domains.${index}.https`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protocol</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "https")}
                    defaultValue={field.value ? "https" : "http"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="http">http://</SelectItem>
                      <SelectItem value="https">https://</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* toggle */}
            <SimpleFormField
              control={form.control}
              name={`domains.${index}.forceSSL`}
              friendlyName="Use HTTPS"
              render={({ field }) => <Switch {...field} className="block" />}
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
          </div>
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
            onClick={() => domainsForm.append()}
          >
            Add Domain
          </Button>

          <FormUnsavedChangesIndicator form={form} />
        </div>
      </form>
    </Form>
  );
}
