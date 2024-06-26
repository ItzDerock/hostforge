"use client";

import { usePathname } from "next/navigation";

const trimTrailingSlash = (path: string) => path.replace(/\/$/, "");

type SidebarNavItem = {
  title: string;
  description?: string;
  href?: string;
};

export function SettingsHeader(props: { items: SidebarNavItem[] }) {
  const path = usePathname();
  const active = props.items.find(
    (item) => trimTrailingSlash(item?.href ?? "") === path,
  );

  return (
    <div>
      <h3 className="text-lg font-medium">{active?.title}</h3>
      <p className="text-muted-foreground">{active?.description}</p>
    </div>
  );
}
