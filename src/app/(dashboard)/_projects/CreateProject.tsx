"use client";

import { useForm } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { toast } from "sonner";
import { FormInputGroup } from "~/components/FormInput";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

// kinda large dependency, but syntax highlighting is nice
const Editor = React.lazy(() => import("./YAMLEditor"));

enum ProjectType {
  Template = "template",
  Compose = "compose",
  Blank = "blank",
}

export function CreateProjectButton() {
  const create = api.projects.create.useMutation({
    onError(error) {
      toast.error(error.message);
    },
  });

  const form = useForm({
    initialValues: {
      name: "",
      internalName: "",
      type: ProjectType.Template,
      composeURL: "",
      composeFile:
        "version: '3.8'\n\nservices:\n# Everything written here will be transformed into a HostForge service.\n# Please note that some options are not supported by Docker Swarm and not all options are supported by HostForge.",
    },

    validate: {
      composeFile: (value, others) => {
        if (others.type === ProjectType.Compose && !value) {
          return "A Docker Compose file is required";
        }
      },

      name: (value) => !value && "A project name is required",

      internalName: (value) => {
        if (!value) {
          return "An internal project name is required";
        }

        if (!/^[a-z0-9\-]+$/g.test(value)) {
          return "Internal project names can only contain letters, numbers, and dashes";
        }
      },
    },
  });

  const fetchComposeFile = useQuery(
    ["fetchComposeFile", form.values.composeURL],
    async () => {
      const response = await fetch(form.values.composeURL);
      return await response.text();
    },
    {
      enabled: false,
      cacheTime: 0,
      retry: false,
      onSuccess(data) {
        form.setFieldValue("composeFile", data);
        toast.success("Fetched Docker Compose file");
      },
      onError(error) {
        toast.error("Failed to fetch Docker Compose file");
        console.error(error);
      },
    },
  );

  // reset fetchComposeFile when the URL changes
  React.useEffect(() => {
    fetchComposeFile.remove();
  }, [form.values.composeURL]);

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

        <form
          onSubmit={form.onSubmit((data) => {
            create.mutate({
              friendlyName: data.name,
              internalName: data.internalName,
            });
          })}
          className="max-w-full space-y-4"
          id="create-project-form"
        >
          <FormInputGroup
            label="Project Name"
            description="The name of your project"
            required
            form={form}
            formKey="name"
          >
            <Input
              id="project-name"
              placeholder="My Project"
              className="w-full"
              {...form.getInputProps("name")}
              onChange={(e) => {
                form.setFieldValue("name", e.target.value);

                if (!form.isDirty("internalName")) {
                  form.setFieldValue(
                    "internalName",
                    e.target.value.replace(/[^a-zA-Z\d:]/g, "-").toLowerCase(),
                  );

                  form.setDirty({ internalName: false });
                }
              }}
            />
          </FormInputGroup>

          <FormInputGroup
            label="Internal Project Name"
            description="The name of your project, used internally for networking and DNS"
            required
            form={form}
            formKey="internalName"
          >
            <Input
              id="project-internal-name"
              placeholder="my-project"
              className="w-full"
              {...form.getInputProps("internalName")}
            />
          </FormInputGroup>

          <Tabs defaultValue="templates" className="w-full max-w-full">
            <TabsList className="mx-auto flex w-fit flex-wrap items-center text-center">
              <TabsTrigger value="templates">Template</TabsTrigger>
              <TabsTrigger value="compose">Docker Compose</TabsTrigger>
              <TabsTrigger value="blank">Blank Project</TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <div className="rounded-md bg-background p-4">
                <p>Templates</p>
              </div>
            </TabsContent>

            <TabsContent value="compose" className="space-y-2">
              <Label htmlFor="compose-url">Docker Compose URL</Label>
              <div className="flex flex-row gap-2">
                {/* Maybe we should add the ability to fetch URLs protected by CORS by routing through the server 
                    Currently sites like pastebin.com will not work due to strict CORS policies

                    If we do this, make sure the user cannot access private URLs and proper input validation is done */}
                <Input
                  id="compose-url"
                  placeholder="https://example.com/docker-compose.yml"
                  className="flex-grow"
                  type="url"
                  {...form.getInputProps("composeURL")}
                />
                <Button
                  type="button"
                  variant={fetchComposeFile.isSuccess ? "success" : "outline"}
                  onClick={() => fetchComposeFile.refetch()}
                  isLoading={fetchComposeFile.isFetching}
                  disabled={
                    fetchComposeFile.isFetching || !form.values.composeURL
                  }
                >
                  {fetchComposeFile.isSuccess ? "Fetched!" : "Fetch"}
                </Button>
              </div>

              <Label htmlFor="compose-file" className="mt-2">
                Docker Compose File
              </Label>
              <Suspense fallback={<div>Loading the editor...</div>}>
                <Editor
                  value={form.values.composeFile}
                  onChange={(value) => form.setFieldValue("composeFile", value)}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="blank"></TabsContent>
          </Tabs>
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="create-project-form"
            isLoading={create.isLoading}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
