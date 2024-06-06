"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";
import { SimpleFormField } from "~/hooks/forms";
import { type ProjectCreationValidator } from "./CreateProject";

export default function CreateProjectBasicDetails() {
  const form = useFormContext<z.infer<typeof ProjectCreationValidator>>();

  const name = form.watch("name") ?? "";
  const internalNameState = form.getFieldState("internalName");

  useEffect(() => {
    if (!internalNameState.isDirty) {
      form.setValue(
        "internalName",
        name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      );
    }
  }, [name, internalNameState.isDirty, form]);

  return (
    <>
      <SimpleFormField
        name="name"
        control={form.control}
        friendlyName="Project Name"
        description="The name of your project."
        required
      />

      <SimpleFormField
        name="internalName"
        control={form.control}
        friendlyName="Internal Name"
        description="The name of your project, used internally for networking and DNS"
        required
      />
    </>
  );
}
