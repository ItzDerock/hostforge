"use client";

import { useMemo, useState } from "react";
import { FaSortAmountDown } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { CreateProjectButton } from "./CreateProject";
import { Project } from "./Project";

type Projects = RouterOutputs["projects"]["list"];

enum SortMethod {
  Name,
  Date,
  Status,
}

export function ProjectList({ defaultValue }: { defaultValue: Projects }) {
  const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.Name);
  const projects = api.projects.list.useQuery(undefined, {
    initialData: defaultValue,
  });

  const sortedProjects = useMemo(
    () =>
      projects.data.sort((a, b) => {
        switch (sortMethod) {
          case SortMethod.Name:
            return a.friendlyName.localeCompare(b.friendlyName);
          case SortMethod.Date:
            return a.createdAt - b.createdAt;

          default:
            return 0;
        }
      }),
    [projects.data, sortMethod],
  );

  return (
    <>
      <div className="mt-4 flex w-full flex-row justify-between align-bottom">
        <h2 className="mb-0 mt-auto block text-xl font-semibold">Projects</h2>
        <div className="flex flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <div className="sr-only">Sort</div>
                <FaSortAmountDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32">
              <DropdownMenuLabel>Sorting</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setSortMethod(SortMethod.Name)}
                  className="cursor-pointer"
                >
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortMethod(SortMethod.Date)}
                  className="cursor-pointer"
                >
                  Date
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortMethod(SortMethod.Status)}
                  className="cursor-pointer"
                >
                  Status
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateProjectButton />
        </div>
      </div>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {sortedProjects.map((project, key) => (
          <Project key={key} project={project} />
        ))}

        {sortedProjects.length === 0 && (
          <div className="col-span-2 py-16">
            <p className="text-center text-primary-foreground/70">
              You don&apos;t have any projects yet. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
