import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import {
  Cog,
  LogOut,
  ScanFace,
  Settings,
  Settings2,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/server";
import { Resources } from "./_components/Resources";

export default async function Navbar() {
  const user = await api.auth.me.query();

  return (
    <nav className="py-4">
      <div className="mx-auto flex h-12 flex-row items-center gap-4">
        <div>
          <Link href="/">Hostforge</Link>{" "}
        </div>

        <Resources />

        <div className="flex-grow" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {/* <Settings /> */}
              <Cog />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="mr-4 min-w-36">
            <DropdownMenuLabel>Welcome, {user.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/account">
                <UserCog className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/sessions">
                <ScanFace className="mr-2 size-4" />
                Sessions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings2 className="mr-2 size-4" />
                HostForge Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
