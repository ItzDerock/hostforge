"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import LoadingScreen from "~/components/LoadingScreen";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { FormSubmit, SimpleFormField, useForm } from "~/hooks/forms";
import { ServiceBuildMethod, ServiceSource } from "~/server/db/types";
import { zDockerImage } from "~/server/utils/zod";
import { api } from "~/trpc/react";
import { useService } from "../_hooks/service";
import SourceBuildMethod from "./_components/BuildMethod";
import SourceGitHub from "./_components/SourceGitHub";

export const formValidator = z.object({
  source: z.nativeEnum(ServiceSource),

  dockerImage: zDockerImage.nullable(),
  dockerRegistryUsername: z.string().optional(),
  dockerRegistryPassword: z.string().optional(),

  githubUsername: z.string().optional(),
  githubRepository: z.string().optional(),
  githubBranch: z.string().optional(),

  buildMethod: z.nativeEnum(ServiceBuildMethod),
  buildPath: z.string().default("/"),
});

export default function SourcePage() {
  const { data, refetch } = useService();
  const form = useForm(formValidator, {});
  const selectedSource = form.watch("source");
  const mutate = api.projects.services.update.useMutation();

  const resetForm = () =>
    form.reset(
      {
        source: data?.source,
        dockerImage: data?.dockerImage,
        dockerRegistryUsername: data?.dockerRegistryUsername ?? undefined,
        dockerRegistryPassword: data?.dockerRegistryPassword ?? undefined,
        githubUsername: data?.githubUsername ?? undefined,
        githubRepository: data?.githubRepository ?? undefined,
        githubBranch: data?.githubBranch ?? undefined,
        buildMethod: data?.buildMethod ?? ServiceBuildMethod.Nixpacks,
        buildPath: data?.buildPath ?? "/",
      },
      {
        keepDirty: true,
      },
    );

  const ActiveIndicator = ({ type }: { type: ServiceSource }) => (
    <span
      className={
        selectedSource === type ? "ml-1 text-xs italic text-primary" : "hidden"
      }
    >
      (active)
    </span>
  );

  const SelectAsActive = ({ type }: { type: ServiceSource }) => (
    <Button
      onClick={() => form.setValue("source", type, { shouldDirty: true })}
      className="col-span-2"
      variant={selectedSource !== type ? "secondary" : "outline"}
      disabled={selectedSource === type}
    >
      Select as active source
    </Button>
  );

  useEffect(() => {
    if (!form.formState.isDirty) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!data) {
    return <LoadingScreen />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (submitData) => {
          if (!data?.projectId || !data.id) {
            console.log("no project id or service id");
            return;
          }

          // if the source is github, we need to validate the github fields
          if (submitData.source === ServiceSource.GitHub) {
            let hasError = false;
            if (!submitData.githubUsername) {
              hasError = true;
              form.setError("githubUsername", {
                message: "GitHub username is required.",
              });
            }

            if (!submitData.githubRepository) {
              hasError = true;
              form.setError("githubRepository", {
                message: "GitHub repository is required.",
              });
            }

            if (hasError) {
              return;
            }
          }

          await mutate.mutateAsync({
            projectId: data.projectId,
            serviceId: data.id,
            ...submitData,
          });

          form.reset(form.getValues(), { keepValues: true, keepDirty: false });

          toast.success(
            "Service source updated successfully! Hit deploy changes to apply the changes.",
          );

          void refetch();
        })}
        className="grid grid-cols-2 gap-4"
      >
        <div className="col-span-2">
          <h1 className="text-xl">Source</h1>
          <p className="text-sm text-muted-foreground">
            Configure the source of your service. If docker is selected as the
            active source, the service will deploy from the selected Docker
            image. If GitHub is selected, the service will deploy from the
            selected GitHub repository. Git can be used for non-github
            repositories.
          </p>
        </div>

        <Tabs
          defaultValue={
            {
              [ServiceSource.Docker]: "docker",
              [ServiceSource.GitHub]: "GitHub",
              [ServiceSource.Git]: "Git",
            }[data.source] || "docker"
          }
          className="col-span-2 w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="docker" className="px-14">
              Docker <ActiveIndicator type={ServiceSource.Docker} />
            </TabsTrigger>
            <TabsTrigger value="GitHub" className="px-14">
              GitHub <ActiveIndicator type={ServiceSource.GitHub} />
            </TabsTrigger>
            <TabsTrigger value="Git" className="px-14">
              Git <ActiveIndicator type={ServiceSource.Git} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="docker" className="grid grid-cols-2 gap-4">
            <SelectAsActive type={ServiceSource.Docker} />

            <SimpleFormField
              control={form.control}
              name="dockerImage"
              friendlyName="Docker Image"
              description="The Docker image to use for this service."
              className="col-span-2"
            />

            <SimpleFormField
              control={form.control}
              name="dockerRegistryUsername"
              friendlyName="Docker Registry Username"
              description="The username to use for the Docker registry."
            />

            <SimpleFormField
              control={form.control}
              name="dockerRegistryPassword"
              friendlyName="Docker Registry Password"
              description="The password to use for the Docker registry."
              type="password"
            />
          </TabsContent>
          <TabsContent value="GitHub" className="grid grid-cols-2 gap-4">
            <SelectAsActive type={ServiceSource.GitHub} />

            <SourceGitHub />
            <SourceBuildMethod />
          </TabsContent>

          <TabsContent value="Git" className="grid grid-cols-2 gap-4">
            Coming Soon
          </TabsContent>
        </Tabs>

        <FormSubmit form={form} className="col-span-2" />
      </form>
    </Form>
  );
}
