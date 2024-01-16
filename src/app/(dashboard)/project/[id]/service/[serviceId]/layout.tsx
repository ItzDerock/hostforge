"use client";

import {
  BoxesIcon,
  CloudyIcon,
  CodeIcon,
  ContainerIcon,
  GlobeIcon,
  HomeIcon,
  SaveAllIcon,
  ServerCogIcon,
} from "lucide-react";
import { SidebarNav, type SidebarNavProps } from "~/components/SidebarNav";
import { useProject } from "../../_context/ProjectContext";

const sidebarNavItems = [
  {
    title: "Home",
    description: "Quick overview of all containers for this project.",
    href: "/home",
    icon: HomeIcon,
  },

  {
    type: "divider",
    title: "Deployment",
  },

  {
    title: "Containers",
    description: "Lists all containers deployed for this service.",
    href: "/containers",
    icon: BoxesIcon,
  },
  {
    title: "Deployments",
    description: "All deployments for this service.",
    href: "/deployments",
    icon: CloudyIcon,
  },

  {
    type: "divider",
    title: "Build Settings",
  },

  {
    title: "Source",
    description: "Source settings",
    href: "/source",
    icon: CodeIcon,
  },
  {
    title: "Domains",
    description: "Domain settings",
    href: "/domains",
    icon: GlobeIcon,
  },
  {
    title: "Environment",
    description: "Environment settings",
    href: "/environment",
    icon: ContainerIcon,
  },
  {
    title: "Volumes",
    description: "Volume settings",
    href: "/volumes",
    icon: SaveAllIcon,
  },
  {
    title: "Advanced",
    description: "Advanced settings",
    href: "/replication",
    icon: ServerCogIcon,
  },
] as const;

export default function ProjectHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const project = useProject();
  const items = sidebarNavItems.map((item) => ({
    ...item,
    href: "href" in item ? `${project.servicePath}${item.href}` : undefined,
  })) as SidebarNavProps["items"];

  return (
    <div className="hidden space-y-6 py-10 md:block">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={items} />
        </aside>
        <div className="flex-1 flex-grow space-y-6">
          {/* <SettingsHeader items={items} /> */}
          {/* <Separator /> */}
          {children}
        </div>
      </div>
    </div>
  );
}
