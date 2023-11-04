"use client";

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
import { useForm } from "@mantine/form";

export default function LoginForm() {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Card className="mx-auto w-80">
      <CardHeader>
        <CardTitle>Hostforge</CardTitle>
        <CardDescription>Log into your account to start.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {/* basic login */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Username</Label>
          <Input id="email" type="email" placeholder="jsmith" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" />
        </div>

        {/* or */}
        <div className="flex items-center gap-2">
          <hr className="flex-grow border-gray-300" />
          <span className="text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* social login */}
        <Button variant="outline">
          {/* TODO: icons */}
          GitHub
        </Button>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Log In</Button>
      </CardFooter>
    </Card>
  );
}
