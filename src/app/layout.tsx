import "~/styles/globals.css";

import { Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "~/components/contexts/ThemeProvider";
import { ToastProvider } from "~/components/contexts/ToastProvider";
import { TRPCReactProvider } from "~/trpc/react";
import {
  AppProgressBar,
  NextAdapterApp,
  QueryParamProvider,
} from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata = {
  title: "Hostforge",
  description: "Open-source infrastructure management platform.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${outfit.variable} min-h-screen min-w-full`}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ToastProvider>
              <QueryParamProvider adapter={NextAdapterApp}>
                <AppProgressBar
                  color="hsl(var(--primary))"
                  delay={200}
                  options={{ showSpinner: false }}
                />
                {children}
              </QueryParamProvider>
            </ToastProvider>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
