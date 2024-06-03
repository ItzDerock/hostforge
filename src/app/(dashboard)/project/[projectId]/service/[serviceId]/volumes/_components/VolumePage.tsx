"use client";

import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { FormSubmit, useForm } from "~/hooks/forms";
import VolumeEntry from "./VolumeEntry";
import { api } from "~/trpc/react";
import { useProject } from "../../../../_context/ProjectContext";
import { DOCKER_VOLUME_TYPE_MAP } from "~/server/db/types";
import { useEffect } from "react";

export const formValidator = z.object({
  volumes: z.array(
    z.object({
      mountId: z.string().optional(),
      source: z.string().min(1),
      target: z.string().min(1),
      type: z.enum(["tmpfs", "volume", "bind"]),
    }),
  ),
});

export function VolumesPage() {
  const project = useProject();
  const mutation = api.projects.services.updateVolumes.useMutation();

  const form = useForm(formValidator, {
    defaultValues: {
      volumes: [],
    },
  });

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "volumes",
  });

  useEffect(() => {
    if (mutation.data) {
      const volumes =
        mutation.data.map((data) => ({
          type: DOCKER_VOLUME_TYPE_MAP[data.type],
          source: data.source,
          target: data.target,
          mountId: data.id,
        })) ?? [];

      form.reset(
        {
          volumes,
        },
        {
          keepDirty: false, // tried without this option
        },
      );

      form.reset();
      form.reset({}, { keepValues: true, keepDirty: false });

      console.log(volumes, fields);
      // i have also tried moving all of this into the handleSubmit function
    }
  }, [mutation.data]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await mutation.mutateAsync({
            projectId: project.id,
            serviceId: project.selectedService!.id,
            volumes: data.volumes,
          });
        })}
      >
        <h1 className="text-lg">Volumes and Mounts</h1>
        <p className="text-muted-foreground">
          Volumes are used to persist data between container restarts. You can
          mount a volume from the host machine.
        </p>

        <section className="my-4 flex flex-col gap-4">
          {fields.map((_, index) => (
            <VolumeEntry key={index} index={index} remove={remove} />
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
