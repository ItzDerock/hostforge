"use client";

import { usePathname, useRouter } from "next/navigation";

export default function ServicePage() {
  const router = useRouter();
  const pathname = usePathname();

  // redirect to ./home
  router.push(pathname + "/home");

  return <div>Redirecting you...</div>;
}
