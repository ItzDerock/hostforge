import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Trash } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "~/components/ui/form";
import { SimpleFormField } from "~/hooks/forms";
import { DOCKER_VOLUME_TYPE_MAP, DockerVolumeType } from "~/server/db/types";
import type { formValidator } from "./VolumePage";
import type { z } from "zod";
import { useFieldArray, useFormContext } from "react-hook-form";

export default function VolumeEntry({
  index,
  remove,
}: {
  index: number;
  remove: (index: number) => void;
}) {
  const form = useFormContext<z.infer<typeof formValidator>>();
  const type = form.watch(`volumes.${index}.type`);

  return (
    <Card key={index} className="flex flex-row gap-4 p-4">
      <FormField
        control={form.control}
        name={`volumes.${index}.type`}
        render={({ field }) => (
          <FormItem className="w-44">
            <FormLabel>Mount Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  value={DOCKER_VOLUME_TYPE_MAP[DockerVolumeType.Bind]}
                >
                  Bind
                </SelectItem>
                <SelectItem
                  value={DOCKER_VOLUME_TYPE_MAP[DockerVolumeType.Volume]}
                >
                  Volume
                </SelectItem>
                <SelectItem
                  value={DOCKER_VOLUME_TYPE_MAP[DockerVolumeType.Tmpfs]}
                >
                  Tmpfs
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>The type of mount.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <SimpleFormField
        control={form.control}
        name={`volumes.${index}.source`}
        friendlyName={type === "bind" ? "Source Path" : "Volume Name"}
        description={
          type === "bind"
            ? "The path on the host machine."
            : "The name of the volume."
        }
        className="flex-grow"
      />
      <SimpleFormField
        control={form.control}
        name={`volumes.${index}.target`}
        friendlyName="Target Path"
        description="The path inside the container."
        className="flex-grow"
      />
      <Button
        type="button"
        className="mt-8"
        variant="destructive"
        onClick={() => {
          remove(index);
          console.log(index);
        }}
        icon={Trash}
      />
    </Card>
  );
}
