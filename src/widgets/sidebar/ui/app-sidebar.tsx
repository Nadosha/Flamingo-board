'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { createClient } from '@/shared/lib/supabase/client';
import { getInitials } from '@/shared/lib/utils';

interface Props {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function AppSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-secondary/30">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <span className="font-bold text-sm">CollabBoard</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <Link
          href="/workspaces"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/workspaces'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Workspaces
        </Link>
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.full_name ?? user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left overflow-hidden">
                <p className="font-medium truncate text-xs leading-tight">
                  {user.full_name ?? user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {user.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <Settings className="h-4 w-4 mr-2" />
                Profile settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
