"use client";

import { z } from "zod";
import { FormField, FormItem, FormMessage, Form } from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { FormSubmit, useForm } from "~/hooks/forms";
import { api } from "~/trpc/react";

export default function EnvironmentPage({
  serviceId,
  projectId,
  defaultEnv,
}: {
  serviceId: string;
  projectId: string;
  defaultEnv: string;
}) {
  const form = useForm(
    z.object({
      env: z.string(),
    }),
    {
      defaultValues: {
        env: defaultEnv,
      },
    },
  );

  const mutation = api.projects.services.update.useMutation();

  return (
    <Form {...form}>
      <form
        onClick={form.handleSubmit(async (data) => {
          await mutation.mutateAsync({
            projectId,
            serviceId,
            environment: data.env,
          });

          form.reset(
            { env: data.env },
            {
              keepDirty: false,
            },
          );
        })}
      >
        <FormField
          control={form.control}
          name="env"
          render={({ field }) => (
            <FormItem>
              <Textarea
                {...field}
                className="input input-bordered input-sm textarea h-[80vh] md:h-[40vh]"
                placeholder="KEY=VALUE"
                required
              />

              <FormMessage />
            </FormItem>
          )}
        />

        <FormSubmit form={form} className="mt-2" />
      </form>
    </Form>
  );
}
