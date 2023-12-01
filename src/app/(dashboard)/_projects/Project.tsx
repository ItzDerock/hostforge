"use client";

import Link from "next/link";
import { FaArrowUpRightFromSquare, FaGear } from "react-icons/fa6";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { type RouterOutputs } from "~/trpc/shared";

type Project = RouterOutputs["projects"]["list"][number];

export function Project({ project }: { project: Project }) {
  return (
    <Card>
      {/* 
      Card header contains:
      - Project name
      - Project health
      - Basic project stats 
      */}
      <CardHeader className="flex flex-row flex-wrap justify-between">
        {/* Name and health */}
        <div>
          <CardTitle className="font-semibold">
            <Link href={`/projects/${project.internalName}`}>
              {project.friendlyName}{" "}
              <FaArrowUpRightFromSquare className="inline-block h-[10px]" />
            </Link>
          </CardTitle>
          <p className="mb-auto mt-0 text-sm text-muted-foreground">
            3/3 - Healthy
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-row gap-2 text-center">
          {/* CPU */}
          <div>
            <CardTitle>CPU</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>

          {/* Memory */}
          <div>
            <CardTitle>MEM</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>

          {/* Disk */}
          <div>
            <CardTitle>DISK</CardTitle>
            <p className="mb-auto mt-0 text-sm text-muted-foreground">33%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.services.map((service, id) => (
              <TableRow key={id}>
                <TableCell className="font-semibold">{service.name}</TableCell>
                <TableCell>Database</TableCell>
                <TableCell>Healthy</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        <span className="sr-only">Actions</span>
                        <FaGear />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>test</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {project.services.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No services
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
