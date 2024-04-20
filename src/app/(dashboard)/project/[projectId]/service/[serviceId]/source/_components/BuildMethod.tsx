"use client";

import { useFormContext, type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import { Label } from "~/components/ui/label";
import { SimpleFormField } from "~/hooks/forms";
import { ServiceBuildMethod } from "~/server/db/types";
import { type formValidator } from "../page";

export default function SourceBuildMethod() {
  const form = useFormContext<z.infer<typeof formValidator>>();
  const selected = form.watch("buildMethod");

  return (
    <>
      <div className="col-span-2 space-y-2">
        <Label>Build Method</Label>

        <div aria-label="Build Method" className="flex w-full flex-col gap-2">
          <RadioOption
            form={form}
            title="Nixpacks"
            description="Automatically detects the language and dependencies for your project and builds it with the power of Nix. Use this if you want a configuration-free experience."
            value={ServiceBuildMethod.Nixpacks}
          />

          <RadioOption
            form={form}
            title="Buildpacks"
            description="Heroku-style buildpacks that automatically detect the language and dependencies for your project and build it accordingly. Similar to Nixpacks."
            value={ServiceBuildMethod.Buildpacks}
          />

          <RadioOption
            form={form}
            title="Dockerfile"
            description="Use a Dockerfile to build and deploy your application. This provides more control and flexibility, but requires more configuration."
            value={ServiceBuildMethod.Dockerfile}
          />
        </div>
      </div>

      <SimpleFormField
        control={form.control}
        name="buildPath"
        friendlyName="Build Path"
        description="The path to the build directory. This is where the build command will be run. For dockerfiles, this can be the path to the Dockerfile if it is something else."
        className="col-span-2"
      />
    </>
  );
}

function RadioOption({
  form,
  title,
  description,
  value,
}: {
  form: UseFormReturn<z.infer<typeof formValidator>>;
  title: string;
  description: string;
  value: ServiceBuildMethod;
}) {
  const selected = form.watch("buildMethod") === value;

  return (
    <div
      className="flex items-center gap-3"
      onClick={() => {
        form.setValue("buildMethod", value, { shouldDirty: true });
      }}
    >
      <Label
        className="flex w-full cursor-pointer flex-row gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow transition-all hover:border-muted-foreground"
        htmlFor={"buildmethod-" + value.toString()}
      >
        <div
          className={
            "flex h-6 w-6 items-center justify-center rounded-full border transition-colors" +
            (selected ? " border-primary" : " border-muted")
          }
        >
          <div
            className={
              "h-3.5 w-3.5 rounded-full transition-colors" +
              (selected ? " bg-primary" : " bg-muted")
            }
          />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-base font-medium">{title}</p>
          <p className="text-sm font-normal text-muted-foreground">
            {description}
          </p>
        </div>
      </Label>
    </div>
  );
}
