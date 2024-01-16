"use client";

import { HomeIcon } from "lucide-react";
import { SettingsHeader } from "~/app/(dashboard)/settings/SettingsHeader";
import { SidebarNav } from "~/components/SidebarNav";
import { Separator } from "~/components/ui/separator";
import { useProject } from "../_context/ProjectContext";

const sidebarNavItems = [
  {
    title: "Home",
    description: "Quick overview of all containers for this project.",
    href: "/",
    icon: HomeIcon,
  },
  {
    title: "Sessions",
    description: "Manage your active sessions and logout remotely.",
    href: "/sessions",
  },
];

export default function ProjectHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const project = useProject();
  const items = sidebarNavItems.map((item) => ({
    ...item,
    href: `${project.path}${item.href}`,
  }));

  return (
    <div className="hidden space-y-6 py-10 md:block">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={items} />
        </aside>
        <div className="flex-1 space-y-6 lg:max-w-2xl">
          <SettingsHeader items={items} />
          <Separator />
          {children}
        </div>
      </div>
    </div>
  );
}
