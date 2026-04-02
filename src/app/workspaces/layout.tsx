import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar, MobileSidebar } from '@/widgets/sidebar/ui/app-sidebar';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const apiBase =
    process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:4000/api';

  try {
    const res = await fetch(`${apiBase}/auth/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: string; email: string; full_name: string | null; avatar_url: string | null }>;
  } catch {
    return null;
  }
}

export default async function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const userProps = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <AppSidebar user={userProps} />

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 h-12 shrink-0 px-3 border-b border-border bg-card">
        <MobileSidebar user={userProps} />
        <span className="font-bold text-sm">HolyMoly</span>
      </div>

      <main className="flex-1 overflow-hidden bg-muted">
        {children}
      </main>
    </div>
  );
}
