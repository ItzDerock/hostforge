"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
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
import { Input } from "~/components/ui/input";
import { FormField, useForm } from "~/hooks/forms";
import { zDockerName } from "~/server/utils/zod";
import { api } from "~/trpc/react";
import { useProject } from "../_context/ProjectContext";

const formSchema = z.object({
  name: zDockerName,
});

export function CreateService() {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const project = useProject();

  const mutate = api.projects.services.create.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getQueryKey(
          api.projects.get,
          { projectId: project.id },
          "query",
        ),
      });

      setOpen(false);
    },
  });

  const form = useForm(formSchema);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={Plus}>
          New Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Service</DialogTitle>
          <DialogDescription>
            Create a new service for {project.friendlyName}. You will be able to
            configure this service before deploying it in the next step.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                mutate.mutate({
                  name: data.name,
                  projectId: project.internalName,
                }),
              )}
            >
              <FormField
                control={form.control}
                name="name"
                friendlyName="Service Name"
                description="This is the name of the service as it will appear in the Docker Compose file. It must be a valid Docker name."
                required
                render={({ field }) => (
                  <Input placeholder="my-service" {...field} />
                )}
              />

              <Button
                type="submit"
                className="float-right"
                isLoading={mutate.isPending}
              >
                Create
              </Button>
            </form>
          </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
