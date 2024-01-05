"use client";

import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export default function LoginForm() {
  const router = useRouter();
  const [toastLoading, setToastLoading] = useState<
    string | number | undefined
  >();

  const login = api.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Successfully logged in!", { id: toastLoading });
      router.push("/#");
    },

    trpc: {
      context: {
        toastId: toastLoading,
      },
    },
  });

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Card className="mx-auto w-80">
      <CardHeader>
        <CardTitle>🔥 Hostforge</CardTitle>
        <CardDescription>Log into your account to start.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          id="loginform"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate(form.values);
            setToastLoading(toast.loading("Logging you in..."));
          }}
        >
          {/* basic login */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="jsmith"
              {...form.getInputProps("username")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.getInputProps("password")}
            />
          </div>
        </form>
        {/* or */}
        {/* <div className="flex items-center gap-2">
          <hr className="flex-grow border-gray-300" />
          <span className="text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div> */}

        {/* social login */}
        {/* <Button variant="outline"> */}
        {/* TODO: icons */}
        {/* GitHub
        </Button> */}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          type="submit"
          form="loginform"
          isLoading={login.isPending}
        >
          Log In
        </Button>
      </CardFooter>
    </Card>
  );
}
