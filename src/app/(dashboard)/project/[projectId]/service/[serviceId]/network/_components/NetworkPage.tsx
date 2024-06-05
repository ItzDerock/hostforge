"use client";

import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { FormSubmit, useForm } from "~/hooks/forms";
import {
  DOCKER_PORT_TYPE_MAP,
  DOCKER_PUBLISH_MODE_MAP,
} from "~/server/db/types";
import { api } from "~/trpc/react";
import { useProject } from "../../../../_context/ProjectContext";
import PortEntry from "./PortEntry";
import { uuidv7 } from "uuidv7";
import type { RouterOutputs } from "~/trpc/shared";
import { zodEnumFromObjValues } from "~/utils/utils";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";

export const formValidator = z.object({
  data: z.array(
    z.object({
      id: z.string().optional(),
      type: zodEnumFromObjValues(DOCKER_PORT_TYPE_MAP),
      publishMode: zodEnumFromObjValues(DOCKER_PUBLISH_MODE_MAP),
      internalPort: z.coerce.number().int().min(1).max(65535),
      externalPort: z.coerce.number().int().min(1).max(65535),
    }),
  ),
});

function transformServerData(
  data: RouterOutputs["projects"]["services"]["updatePorts"] = [],
) {
  return data.map((data) => ({
    ...data,
    type: DOCKER_PORT_TYPE_MAP[data.type],
    publishMode: DOCKER_PUBLISH_MODE_MAP[data.publishMode],
  }));
}

export function NetworkPage() {
  const project = useProject();
  const mutation = api.projects.services.updatePorts.useMutation({
    onSuccess: async () => {
      await project.refetchService();
    },
  });

  const form = useForm(formValidator, {
    defaultValues: {
      data: transformServerData(
        mutation.data ?? project.selectedService?.latestGeneration?.ports,
      ),
    },
  });

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "data",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          const volumes = transformServerData(
            await mutation.mutateAsync({
              projectId: project.id,
              serviceId: project.selectedService!.id,
              data: data.data,
            }),
          );

          form.reset(
            {
              data: volumes,
            },
            {
              keepDirty: false,
            },
          );
        })}
      >
        <h1 className="text-lg">Network</h1>
        <p className="text-muted-foreground">
          Configure the network settings for your service. You can expose ports
          to the public internet.
        </p>

        <section className="my-4 flex flex-col gap-4">
          {fields.map((service, index) => (
            <PortEntry key={service.id} index={index} remove={remove} />
          ))}
        </section>

        <FormSubmit form={form}>
          <Button
            type="button"
            onClick={() =>
              append({
                externalPort: undefined,
                internalPort: undefined,
                publishMode: "host",
                type: "tcp",
                id: uuidv7(),
              })
            }
          >
            Add
          </Button>
        </FormSubmit>
      </form>
    </Form>
  );
}
