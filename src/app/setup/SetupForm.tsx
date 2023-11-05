"use client";

import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Required } from "~/components/ui/required";
import { api } from "~/trpc/react";

export function SetupForm() {
  const router = useRouter();

  // setup mutation
  const [toastLoading, setToastLoading] = useState<
    string | number | undefined
  >();
  const setupInstance = api.setup.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      toast.success("Successfully setup instance!", { id: toastLoading });
    },

    onError: (error) => {
      toast.error(error.message, { id: toastLoading });
    },
  });

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },

    validate: {
      password: (value) => value.length === 0 && "Password is required",
      username: (value) => value.length === 0 && "Username is required",
    },
  });

  return (
    <Card className="m-auto h-fit max-w-xl">
      <CardHeader>
        <CardTitle>Setup Hostforge 🚀</CardTitle>
        <CardDescription>
          Welcome to Hostforge — a modern self-hosted platform for deploying and
          managing your own applications.
          <br /> <br /> To start, please enter your desired username and
          password for the administrator account. You can setup two factor
          authentication later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="setupform"
          className="flex flex-col gap-4"
          onSubmit={form.onSubmit((data) => {
            setToastLoading(toast.loading("Setting up instance..."));
            setupInstance.mutate(data);
          })}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">
              Username
              <Required />
            </Label>
            <Input {...form.getInputProps("username")} id="username" />
            {form.errors.username && (
              <div className="text-red-500">{form.errors.username}</div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">
              Password
              <Required />
            </Label>
            <Input
              {...form.getInputProps("password")}
              id="password"
              type="password"
            />
            {form.errors.password && (
              <div className="text-red-500">{form.errors.password}</div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button className="w-full" type="submit" form="setupform">
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
