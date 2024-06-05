"use client";

import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { FormSubmit, useForm } from "~/hooks/forms";
import { DOCKER_VOLUME_TYPE_MAP } from "~/server/db/types";
import { api } from "~/trpc/react";
import { useProject } from "../../../../_context/ProjectContext";
import VolumeEntry from "./VolumeEntry";
import { uuidv7 } from "uuidv7";
import type { RouterOutputs } from "~/trpc/shared";

export const formValidator = z.object({
  volumes: z.array(
    z.object({
      id: z.string().optional(),
      source: z.string().min(1),
      target: z.string().min(1),
      type: z.enum(["tmpfs", "volume", "bind"]),
    }),
  ),
});

function transformServerData(
  data: RouterOutputs["projects"]["services"]["updateVolumes"] = [],
) {
  return data.map((data) => ({
    type: DOCKER_VOLUME_TYPE_MAP[data.type],
    source: data.source,
    target: data.target,
    id: data.id,
  }));
}

export function VolumesPage() {
  const project = useProject();
  const mutation = api.projects.services.updateVolumes.useMutation({
    onSuccess: async () => {
      await project.refetchService();
    },
  });

  const form = useForm(formValidator, {
    defaultValues: {
      volumes: transformServerData(
        mutation.data ?? project.selectedService?.latestGeneration?.volumes,
      ),
    },
  });

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "volumes",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          const volumes = transformServerData(
            await mutation.mutateAsync({
              projectId: project.id,
              serviceId: project.selectedService!.id,
              data: data.volumes,
            }),
          );

          form.reset(
            {
              volumes,
            },
            {
              keepDirty: false,
            },
          );
        })}
      >
        <h1 className="text-lg">Volumes and Mounts</h1>
        <p className="text-muted-foreground">
          Volumes are used to persist data between container restarts. You can
          mount a volume from the host machine.
        </p>

        <section className="my-4 flex flex-col gap-4">
          {fields.map((service, index) => (
            <VolumeEntry key={service.id} index={index} remove={remove} />
          ))}
        </section>

        <FormSubmit form={form}>
          <Button
            type="button"
            onClick={() =>
              append({
                source: "",
                target: "",
                type: "volume",
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
