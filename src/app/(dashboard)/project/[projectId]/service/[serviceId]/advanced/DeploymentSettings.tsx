"use client";

import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { FormSubmit, SimpleFormField, useForm } from "~/hooks/forms";
import { DOCKER_DEPLOY_MODE_MAP, DockerDeployMode } from "~/server/db/types";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";

const formValidator = z.object({
  replicas: z.coerce.number().int().positive(),
  maxReplicasPerNode: z.number().int().positive().nullable(),
  deployMode: z.enum(["replicated", "global"]),
  zeroDowntime: z.boolean(),
  entrypoint: z.string().optional().nullable(),
  command: z.string().optional().nullable(),
});

export default function DeploymentSettings({
  service,
}: {
  service: RouterOutputs["projects"]["services"]["get"];
}) {
  const update = api.projects.services.update.useMutation();
  const form = useForm(formValidator, {
    defaultValues: {
      replicas: service.replicas,
      maxReplicasPerNode: service.maxReplicasPerNode,
      deployMode: service.deployMode,
      zeroDowntime: service.zeroDowntime,
      entrypoint: service.entrypoint,
      command: service.command,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          return update.mutateAsync({
            serviceId: service.id,
            projectId: service.projectId,
            ...data,
          });
        })}
        className="grid grid-cols-2 gap-4"
      >
        <h1 className="col-span-2">Deployment</h1>

        <SimpleFormField
          control={form.control}
          name="entrypoint"
          friendlyName="Entrypoint"
          description="The entrypoint dictates what command is run inside the container on boot. By default, on most images, this is /bin/sh -c"
          className="col-span-2"
        />

        <SimpleFormField
          control={form.control}
          name="command"
          friendlyName="Command"
          description="This field dictates the arguments that are fed into the entrypoint."
          className="col-span-2"
        />

        <SimpleFormField
          control={form.control}
          name="replicas"
          friendlyName="Replicas"
          description="The number of containers to run for this service."
        />

        <SimpleFormField
          control={form.control}
          name="maxReplicasPerNode"
          friendlyName="Max Replicas Per Node"
          description="The maximum number of containers to run for this service on a single node."
        />

        <FormField
          control={form.control}
          name="deployMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deploy Mode</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value?.toString() ?? "replicated"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    value={DOCKER_DEPLOY_MODE_MAP[DockerDeployMode.Global]}
                  >
                    Global
                  </SelectItem>
                  <SelectItem
                    value={DOCKER_DEPLOY_MODE_MAP[DockerDeployMode.Replicated]}
                  >
                    Replicated
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Global mode will ensure that only one container runs per node.
                Replicated mode will run the specified number of containers, but
                it is up to the swarm manager to decide which nodes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <SimpleFormField
          control={form.control}
          name="zeroDowntime"
          friendlyName="Zero Downtime"
          description="When enabled, old containers will stay running until the new containers are online, alowing for zero-downtime deployments."
          render={({ field }) => <Switch {...field} className="!my-4 block" />}
        />

        <FormSubmit form={form} className="col-span-2" />
      </form>
    </Form>
  );
}