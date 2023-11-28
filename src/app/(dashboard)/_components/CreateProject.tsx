"use client";

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
import { useForm } from "@mantine/form";
import { Textarea } from "~/components/ui/textarea";
import React, { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// kinda large dependency, but syntax highlighting is nice
const Editor = React.lazy(() => import("./YAMLEditor"));

enum ProjectType {
  Template = "template",
  Compose = "compose",
  Blank = "blank",
}

export function CreateProjectButton() {
  const form = useForm({
    initialValues: {
      name: "",
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
      onSuccess(data) {
        form.setFieldValue("composeFile", data);
        toast.success("Fetched Docker Compose file");
      },
    },
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Project</Button>
      </DialogTrigger>

      <DialogContent className="m-4 max-w-4xl overflow-scroll [&>*]:max-w-full">
        <DialogHeader>
          <DialogTitle>Create a Project</DialogTitle>
          <DialogDescription>
            Each project has it's own private internal network and is isolated
            from other projects. You can either create a blank project or choose
            from a template.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.onSubmit(() => {})}
          className="max-w-full space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="My Project"
              className="w-full"
            />
          </div>
          <Tabs defaultValue="templates" className="w-full max-w-full">
            <TabsList className="mx-auto">
              <TabsTrigger value="templates">From a Template</TabsTrigger>
              <TabsTrigger value="compose">
                From a Docker Compose file
              </TabsTrigger>
              <TabsTrigger value="blank">Create Blank Project</TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <div className="rounded-md bg-background p-4">
                <p>Templates</p>
              </div>
            </TabsContent>

            <TabsContent value="compose" className="space-y-2">
              <Label htmlFor="compose-url">Docker Compose URL</Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="compose-url"
                  placeholder="https://example.com/docker-compose.yml"
                  className="flex-grow"
                  {...form.getInputProps("composeURL")}
                />
                <Button
                  variant="outline"
                  onClick={() => fetchComposeFile.refetch()}
                  isLoading={fetchComposeFile.isFetching}
                >
                  Fetch
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
          <Button type="submit">Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
