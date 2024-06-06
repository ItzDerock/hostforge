"use client";

import { Check, ChevronRight } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";
import {
  CreateProjectStep,
  CreateProjectType,
  type ProjectCreationValidator,
} from "./CreateProject";

export default function CreateProjectSelectType() {
  const form = useFormContext<z.infer<typeof ProjectCreationValidator>>();
  const active = form.watch("type");

  const setStep = (step: CreateProjectStep, type: CreateProjectType) => () => {
    form.setValue("type", type);
    form.setValue("step", step);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          "flex cursor-pointer flex-row rounded-md border border-border p-4 align-middle transition-colors hover:bg-accent" +
          (active === CreateProjectType.Template ? " bg-accent" : "")
        }
        onClick={setStep(
          CreateProjectStep.FromTemplate,
          CreateProjectType.Template,
        )}
      >
        <div className="flex-grow">
          <h1 className="font-bold">Template</h1>
          <p className="text-muted-foreground">
            Quickly deploy a whole stack from one of the built-in templates.
          </p>
        </div>

        {active === CreateProjectType.Template ? (
          <Check className="my-auto" />
        ) : (
          <ChevronRight className="my-auto" />
        )}
      </div>

      <div
        className={
          "flex cursor-pointer flex-row rounded-md border border-border p-4 align-middle transition-colors hover:bg-accent" +
          (active === CreateProjectType.Compose ? " bg-accent" : "")
        }
        onClick={setStep(
          CreateProjectStep.FromCompose,
          CreateProjectType.Compose,
        )}
      >
        <div className="flex-grow">
          <h1 className="font-bold">Docker Compose</h1>
          <p className="text-muted-foreground">
            Import services from an existing docker-compose.yml file.
          </p>
        </div>

        {active === CreateProjectType.Compose ? (
          <Check className="my-auto" />
        ) : (
          <ChevronRight className="my-auto" />
        )}
      </div>

      <div
        className={
          "flex cursor-pointer flex-row rounded-md border border-border p-4 align-middle transition-colors hover:bg-accent" +
          (active === CreateProjectType.Blank ? " bg-accent" : "")
        }
        onClick={setStep(
          CreateProjectStep.BasicDetails,
          CreateProjectType.Blank,
        )}
      >
        <div className="flex-grow">
          <h1 className="font-bold">Blank Project</h1>
          <p className="text-muted-foreground">
            Start from scratch and add services on your own.
          </p>
        </div>

        {active === CreateProjectType.Blank ? (
          <Check className="my-auto" />
        ) : (
          <ChevronRight className="my-auto" />
        )}
      </div>
    </div>
  );
}
