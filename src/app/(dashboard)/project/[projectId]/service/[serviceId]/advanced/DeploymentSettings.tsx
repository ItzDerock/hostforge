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
import {
  DOCKER_DEPLOY_MODE_MAP,
  DOCKER_RESTART_CONDITION_MAP,
  DockerDeployMode,
  DockerRestartCondition,
} from "~/server/db/types";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";

const formValidator = z.object({
  replicas: z.coerce.number().int().min(0),
  maxReplicasPerNode: z.number().int().positive().nullable(),
  deployMode: z.enum(["global", "replicated"]),
  zeroDowntime: z.boolean(),
  entrypoint: z.string().optional(),
  command: z.string().optional(),
  restart: z.enum(["any", "never", "on-failure"]),

  max_memory: z.string().optional(),
  max_cpu: z.coerce.number().optional(),
});

export default function DeploymentSettings({
  service,
}: {
  service: RouterOutputs["projects"]["services"]["get"];
}) {
  const update = api.projects.services.update.useMutation();
  const latestGen = service.latestGeneration!;

  const form = useForm(formValidator, {
    defaultValues: {
      replicas: latestGen.replicas,
      maxReplicasPerNode: latestGen.maxReplicasPerNode,
      deployMode: DOCKER_DEPLOY_MODE_MAP[latestGen.deployMode],
      zeroDowntime: latestGen.zeroDowntime,
      entrypoint: latestGen.entrypoint ?? "",
      command: latestGen.command ?? "",
      max_memory: latestGen.max_memory,
      max_cpu: latestGen.max_cpu,
      restart: DOCKER_RESTART_CONDITION_MAP[latestGen.restart],
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          try {
            await update.mutateAsync({
              serviceId: service.id,
              projectId: service.projectId,
              ...data,
            });

            // form.reset({}, { keepValues: true });
            form.reset(data);
            // console.log(form.formState.dirtyFields);
          } catch (error) {}
        })}
        className="grid grid-cols-2 gap-4"
      >
        <h1 className="col-span-2 text-lg">Deployment</h1>

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
          description="The number of containers to run for this service. This option has no effect if the deploy mode is set to global."
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

        <FormField
          control={form.control}
          name="restart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restart Policy</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    value={
                      DOCKER_RESTART_CONDITION_MAP[
                        DockerRestartCondition.Always
                      ]
                    }
                  >
                    Always
                  </SelectItem>
                  <SelectItem
                    value={
                      DOCKER_RESTART_CONDITION_MAP[DockerRestartCondition.Never]
                    }
                  >
                    Never
                  </SelectItem>

                  <SelectItem
                    value={
                      DOCKER_RESTART_CONDITION_MAP[
                        DockerRestartCondition.OnFailure
                      ]
                    }
                  >
                    On Failure
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The restart policy dictates when the container should be
                restarted. Always will restart the container if it stops for any
                reason. Never will never restart the container. On Failure will
                only restart the container if it exits with a non-zero exit
                code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <h1 className="col-span-2 text-lg">Resource Limits and Reservations</h1>

        <SimpleFormField
          control={form.control}
          name="max_memory"
          friendlyName="Memory Limit"
          description="The maximum amount of memory that this service can use. Set to `0` for no limit. Example: 512M, 4G"
        />

        <SimpleFormField
          control={form.control}
          name="max_cpu"
          friendlyName="CPU Limit"
          description="The maximum CPU usage that this service can use. Set to `0` for no limit. Example: 1 = 1 core, 0.5 = 50% of a core, etc."
        />

        <FormSubmit form={form} className="col-span-2" />
      </form>
    </Form>
  );
}
