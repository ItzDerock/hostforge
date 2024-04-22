"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/utils/utils";

type SidebarNavEntry = {
  type?: "entry";
  href: string;
  title: string;
  icon?: LucideIcon;
};

type SidebarNavDivider = {
  type: "divider";
  title: string;
  icon?: LucideIcon;
};

export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: (SidebarNavEntry | SidebarNavDivider)[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-col space-x-2 lg:space-x-0 lg:space-y-1",
        className,
      )}
      {...props}
    >
      {items.map((item, i) => {
        const isActive =
          item.type !== "divider"
            ? pathname === item.href.replace(/\/$/, "")
            : false;

        return item.type === "divider" ? (
          <p
            className="pb-1.5 pl-2 pt-4 text-xs tracking-wide text-muted-foreground"
            key={i}
          >
            {item.title}
          </p>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start",
            )}
          >
            {item.icon && (
              <div className="mr-2 rounded-md bg-border p-1.5">
                <item.icon size={16} strokeWidth={1.5} />
              </div>
            )}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
