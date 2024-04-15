"use client";

import { useQuery } from "@tanstack/react-query";
import React, { Suspense, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { type ProjectCreationValidator } from "./CreateProject";

// kinda large dependency, but syntax highlighting is nice
const Editor = React.lazy(() => import("../YAMLEditor"));

export default function CreateProjectFromCompose() {
  const form = useFormContext<z.infer<typeof ProjectCreationValidator>>();

  const fetchComposeFile = useQuery({
    queryKey: ["fetchComposeFile", form.getValues().composeURL],
    queryFn: async () => {
      const fileURL = form.getValues().composeFile;

      if (!fileURL) {
        throw new Error("Invalid URL specified");
      }

      return await fetch(fileURL).then((res) => res.text());
    },
    enabled: false,
    // cacheTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (fetchComposeFile.isError) {
      toast.error("Failed to fetch Docker Compose file");
    } else if (fetchComposeFile.isSuccess) {
      form.setValue("composeFile", fetchComposeFile.data);
      toast.success("Fetched Docker Compose file");
    }
  }, [fetchComposeFile, form]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="compose-url">Docker Compose URL</Label>
      <div className="flex flex-row gap-2">
        {/* Maybe we should add the ability to fetch URLs protected by CORS by routing through the server 
            Currently sites like pastebin.com will not work due to strict CORS policies

            If we do this, make sure the user cannot access private URLs/IPs and proper input validation is done */}
        <Input
          id="compose-url"
          placeholder="https://example.com/docker-compose.yml"
          className="flex-grow"
          type="url"
        />
        <Button
          type="button"
          variant={fetchComposeFile.isSuccess ? "success" : "outline"}
          onClick={() => fetchComposeFile.refetch()}
          isLoading={fetchComposeFile.isFetching}
          disabled={
            fetchComposeFile.isFetching || !form.getValues().composeFile
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
          value={form.getValues().composeFile}
          onChange={(data) => form.setValue("composeFile", data)}
        />
      </Suspense>
    </div>
  );
}
