"use client";

import { stripIndents } from "common-tags";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Form } from "~/components/ui/form";
import { useForm } from "~/hooks/forms";
import { zDockerName } from "~/server/utils/zod";
import { api } from "~/trpc/react";
import CreateProjectBasicDetails from "./1_BasicDetails";
import CreateProjectSelectType from "./2_SelectType";
import CreateProjectFromCompose from "./3b_FromCompose";

export enum CreateProjectType {
  Template = "template",
  Compose = "compose",
  Blank = "blank",
}

export enum CreateProjectStep {
  BasicDetails,
  ChooseType,

  FromTemplate,
  FromCompose,
  FromBlank,
}

export const ProjectCreationValidator = z.object({
  step: z.nativeEnum(CreateProjectStep), // internally used

  type: z.nativeEnum(CreateProjectType),
  internalName: zDockerName,
  name: z.string(),

  // compose
  composeURL: z.string().url().optional(),
  composeFile: z.string(),

  // template
  template: z.string().optional(),
});

/**
 * Flow
 * 1. Choose Type
 *  |-> From Template -> Choose Template Page -> Basic Details
 *  |-> From Compose -> Enter URL -> Fetch -> Basic Details
 *  \-> From Blank -> Basic Details
 *
 * 2. Basic Details -> Submit
 *
 * @returns
 */
export function CreateProjectButton() {
  const create = api.projects.create.useMutation({
    onError(error) {
      toast.error(error.message);
    },
  });

  const form = useForm(ProjectCreationValidator, {
    defaultValues: {
      step: CreateProjectStep.ChooseType,

      composeFile: stripIndents`
        version: '3.8'
        
        services:
        # Everything written here will be transformed into a HostForge service.
        # Please note that some options are not supported by Docker Swarm and not all options are supported by HostForge.`,
    },
  });

  const router = useRouter();
  const [step, type] = form.watch(["step", "type"]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Project</Button>
      </DialogTrigger>

      <DialogContent className="overflow-auto sm:max-w-4xl [&>*]:max-w-full">
        <DialogHeader>
          <DialogTitle>Create a Project</DialogTitle>
          <DialogDescription>
            Each project has it&apos;s own private internal network and is
            isolated from other projects. You can either create a blank project
            or choose from a template.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              const projectId = await create.mutateAsync({
                friendlyName: data.name,
                internalName: data.internalName,
              });

              toast.success("Project created!");
              router.push(`/projects/${projectId}`);
            })}
            className="max-w-full space-y-4"
            id="create-project-form"
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={step}
                className="space-y-2"
                initial="initialState"
                animate="animateState"
                exit="exitState"
                transition={{
                  type: "tween",
                  duration: 0.2,
                }}
                variants={{
                  initialState: {
                    x: "10%",
                    opacity: 0,
                  },
                  animateState: {
                    x: 0,
                    opacity: 1,
                  },
                  exitState: {
                    x: "-10%",
                    opacity: 0,
                  },
                }}
              >
                {step === CreateProjectStep.BasicDetails && (
                  <CreateProjectBasicDetails />
                )}

                {step === CreateProjectStep.ChooseType && (
                  <CreateProjectSelectType />
                )}

                {step === CreateProjectStep.FromCompose && (
                  <CreateProjectFromCompose />
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>

        <DialogFooter>
          {type !== undefined && (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={step === CreateProjectStep.ChooseType}
                onClick={() => {
                  form.setValue(
                    "step",
                    step === CreateProjectStep.BasicDetails
                      ? type === CreateProjectType.Template
                        ? CreateProjectStep.FromTemplate
                        : type === CreateProjectType.Compose
                          ? CreateProjectStep.FromCompose
                          : CreateProjectStep.ChooseType
                      : CreateProjectStep.ChooseType,
                  );
                }}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={
                  step === CreateProjectStep.BasicDetails || type === undefined
                }
                onClick={() => {
                  form.setValue(
                    "step",
                    step === CreateProjectStep.ChooseType
                      ? CreateProjectStep.BasicDetails
                      : step === CreateProjectStep.FromTemplate
                        ? CreateProjectStep.ChooseType
                        : CreateProjectStep.BasicDetails,
                  );
                }}
              >
                Next
              </Button>

              <Button
                type="submit"
                form="create-project-form"
                isLoading={create.isPending}
                disabled={
                  step != CreateProjectStep.BasicDetails || create.isPending
                }
              >
                Create Project
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
