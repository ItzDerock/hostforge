"use client";

import { SidebarNav, type SidebarNavProps } from "~/components/SidebarNav";
import { Separator } from "~/components/ui/separator";
import { SettingsHeader } from "./SettingsHeader";
import { ScanFace, Settings2, UserCog } from "lucide-react";

const sidebarNavItems = [
  {
    type: "divider",
    title: "Global Settings",
  },

  {
    title: "General",
    description: "Manage the global HostForge settings.",
    href: "/settings/general",
    icon: Settings2,
  },

  {
    type: "divider",
    title: "User Settings",
  },

  {
    title: "Account",
    description: "Manage your account security and settings.",
    href: "/settings/account",
    icon: UserCog,
  },
  {
    title: "Sessions",
    description:
      "View your active sessions. Futher controls will be added soon",
    href: "/settings/sessions",
    icon: ScanFace,
  },
] satisfies SidebarNavProps["items"];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="hidden space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings as well as the global instance settings.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-grow space-y-6">
          <SettingsHeader items={sidebarNavItems} />
          <Separator />
          {children}
        </div>
      </div>
    </div>
  );
}
