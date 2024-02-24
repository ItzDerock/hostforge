"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

export default function DomainSlideLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // need to keep state separately just so DOM elements dont get unloaded and break close animation
  const [open, setOpen] = useState(true);

  // re-open on new nav
  useEffect(() => {
    setOpen(true);
  }, [pathname]);

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setOpen(false);
          router.push(
            new URL(pathname + "/../", window.location.href).pathname,
          );
        }
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Domain</SheetTitle>
          <SheetDescription>
            Make advanced changes to the reverse-proxy configuration for this
            domain. Hit the save button on the main page to apply changes.
            Reloading will cause you to lose unsaved edits.
          </SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
