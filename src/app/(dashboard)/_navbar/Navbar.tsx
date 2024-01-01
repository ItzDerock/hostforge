import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { Settings } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/server";

export default async function Navbar() {
  const user = await api.auth.me.query();

  return (
    <nav className="py-4">
      <div className="mx-auto flex h-12 flex-row items-center gap-4">
        <div>
          <Link href="/">Hostforge</Link>{" "}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">Project</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem>Project A</DropdownMenuItem>
            <DropdownMenuItem>Project B</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-grow" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <Settings />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuLabel>Logged in as {user.username}</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
