"use client";

import { useFormContext } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { type z } from "zod";
import { SimpleFormField } from "~/hooks/forms";
import { type formValidator } from "./_form";
import GithubRepoPreview from "./GitHubRepoPreview";

export default function SourceGitHub() {
  const form = useFormContext<z.infer<typeof formValidator>>();

  const [debouncedGithubUsername] = useDebounce(
    form.watch("githubUsername"),
    1000,
    { leading: true },
  );

  const [debouncedGithubRepository] = useDebounce(
    form.watch("githubRepository"),
    1000,
    { leading: true },
  );

  return (
    <>
      <div className="col-span-1 flex flex-row items-center gap-2 align-middle">
        <SimpleFormField
          control={form.control}
          name="githubUsername"
          friendlyName="GitHub Username"
          description="The name of the GitHub repository owner."
          className="flex-grow"
        />
        <p>/</p>
        <SimpleFormField
          control={form.control}
          name="githubRepository"
          friendlyName="GitHub Repository"
          description="The name of the GitHub repository."
          className="flex-grow"
        />
      </div>

      <GithubRepoPreview
        githubUsername={debouncedGithubUsername}
        githubRepository={debouncedGithubRepository}
      />
    </>
  );
}
