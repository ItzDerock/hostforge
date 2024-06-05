import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { Cog, LogOut, ScanFace, Settings2, UserCog } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/server";
import { Resources } from "./_components/Resources";
import hostforgeLogo from "~/assets/logo.svg";
import Image from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";

export default async function Navbar() {
  const user = await api.auth.me.query();

  return (
    <nav className="py-4">
      <div className="mx-auto flex h-12 flex-row items-center gap-4">
        <div className="flex flex-row items-center gap-2">
          <Image
            src={hostforgeLogo as StaticImport}
            className="inline-block w-8"
            alt="logo"
          />
          {/* <Link href="/">Hostforge</Link>{" "} */}
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
