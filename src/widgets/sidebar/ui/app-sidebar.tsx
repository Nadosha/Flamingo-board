'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, Sun, Moon, Monitor, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';
import { authApi } from '@/shared/lib/api/client';
import { getInitials } from '@/shared/lib/utils';

interface Props {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

function SidebarInner({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    await authApi.logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <img src="/logo.svg" alt="HolyMoly" className="h-8 w-8 rounded-xl" />
        <span className="font-bold text-sm">HolyMoly</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <Link
          href="/workspaces"
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/workspaces'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <span className="text-base">📋</span>
          Workspaces
        </Link>
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
          {(['light', 'system', 'dark'] as const).map((t) => {
            const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 flex items-center justify-center rounded-lg p-1 transition-colors ${
                  theme === t
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t.charAt(0).toUpperCase() + t.slice(1)}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-accent transition-colors">
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

/** Desktop sidebar — hidden on mobile */
export function AppSidebar({ user }: Props) {
  return (
    <div className="hidden md:flex h-full">
      <SidebarInner user={user} />
    </div>
  );
}

/** Mobile burger + Sheet — placed in the layout's mobile top bar */
export function MobileSidebar({ user }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent transition-colors">
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-56">
        <SidebarInner user={user} />
      </SheetContent>
    </Sheet>
  );
}

