"use client";

import { useTheme } from "next-themes";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <>
      <Toaster
        position="bottom-center"
        richColors
        theme={theme.resolvedTheme === "dark" ? "dark" : "light"}
      />

      {children}
    </>
  );
}
