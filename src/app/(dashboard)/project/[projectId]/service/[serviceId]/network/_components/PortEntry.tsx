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
import {
  DOCKER_PORT_TYPE_MAP,
  DOCKER_PUBLISH_MODE_MAP,
  DockerPortType,
  DockerPublishMode,
} from "~/server/db/types";
import type { formValidator } from "./NetworkPage";
import type { z } from "zod";
import { useFormContext } from "react-hook-form";

export default function PortEntry({
  index,
  remove,
}: {
  index: number;
  remove: (index: number) => void;
}) {
  const form = useFormContext<z.infer<typeof formValidator>>();

  return (
    <Card key={index} className="flex flex-row gap-4 p-4">
      <FormField
        control={form.control}
        name={`data.${index}.type`}
        render={({ field }) => (
          <FormItem className="w-44">
            <FormLabel>Port Type</FormLabel>
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
                <SelectItem value={DOCKER_PORT_TYPE_MAP[DockerPortType.TCP]}>
                  TCP
                </SelectItem>
                <SelectItem value={DOCKER_PORT_TYPE_MAP[DockerPortType.UDP]}>
                  UDP
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>The OSI Layer 4 protocol.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`data.${index}.publishMode`}
        render={({ field }) => (
          <FormItem className="w-44">
            <FormLabel>Publish Mode</FormLabel>
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
                  value={DOCKER_PUBLISH_MODE_MAP[DockerPublishMode.Host]}
                >
                  Host
                </SelectItem>
                <SelectItem
                  value={DOCKER_PUBLISH_MODE_MAP[DockerPublishMode.Ingress]}
                >
                  Ingress
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Ingress will load balance between all instances of the service.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <SimpleFormField
        control={form.control}
        name={`data.${index}.externalPort`}
        friendlyName="External Port"
        description="The port on the host machine."
        className="flex-grow"
        type="number"
      />
      <SimpleFormField
        control={form.control}
        name={`data.${index}.internalPort`}
        friendlyName="Internal Port"
        description="The port inside the container."
        className="flex-grow"
        type="number"
      />
      <Button
        type="button"
        className="mt-8"
        variant="destructive"
        onClick={() => {
          remove(index);
        }}
        icon={Trash}
      />
    </Card>
  );
}
