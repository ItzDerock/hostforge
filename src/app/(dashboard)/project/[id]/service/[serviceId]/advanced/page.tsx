"use client";

import { Form } from "react-hook-form";
import { z } from "zod";
import { Input } from "~/components/ui/input";
import { FormField, useForm } from "~/hooks/forms";

export default function AdvancedSettings() {
  const form = useForm(
    z.object({
      test: z.string(),
    }),
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))}>
        <FormField
          control={form.control}
          name="test"
          friendlyName="Test"
          required
          render={({ field }) => <Input {...field} />}
        />
      </form>
    </Form>
  );
}
