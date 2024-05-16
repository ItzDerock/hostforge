"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { SimpleFormField, useForm } from "~/hooks/forms";
import { api } from "~/trpc/react";

export function SetupForm() {
  const router = useRouter();

  // setup mutation
  const [toastLoading, setToastLoading] = useState<
    string | number | undefined
  >();
  const setupInstance = api.setup.setup.useMutation({
    onSuccess: () => {
      router.push("/login");
      router.refresh();
      toast.success("Successfully setup instance!", { id: toastLoading });
    },

    onError: (error) => {
      toast.error(error.message, { id: toastLoading });
    },
  });

  const form = useForm(
    z.object({
      username: z.string().min(3),
      password: z.string().min(3),
    }),
  );

  return (
    <Card className="m-auto h-fit max-w-xl">
      <CardHeader>
        <CardTitle>
          Setup Hostforge <span className="animate-shake">🚀</span>
        </CardTitle>
        <CardDescription>
          Welcome to Hostforge — a modern self-hosted platform for deploying and
          managing your own applications.
          <br /> <br /> To start, please enter your desired username and
          password for the administrator account. You can setup two factor
          authentication later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="setupform"
            className="space-y-2"
            onSubmit={form.handleSubmit(async (data) => {
              setToastLoading(toast.loading("Setting up instance..."));
              await setupInstance.mutateAsync(data);
            })}
          >
            <SimpleFormField
              control={form.control}
              name="username"
              friendlyName="Username"
              description="The username for the admin Hostforge user."
              required
            />

            <SimpleFormField
              control={form.control}
              name="password"
              friendlyName="Password"
              description="The password for the admin Hostforge user."
              required
              type="password"
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          type="submit"
          form="setupform"
          isLoading={form.formState.isSubmitting}
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
