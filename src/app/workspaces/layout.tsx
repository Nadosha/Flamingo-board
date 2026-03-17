import { createClient } from '@/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebar, MobileSidebar } from '@/widgets/sidebar/ui/app-sidebar';

export default async function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user!.id)
    .single();

  const profileData = profile as { full_name: string | null; avatar_url: string | null } | null;

  const userProps = {
    id: user.id,
    email: user.email ?? '',
    full_name: profileData?.full_name ?? null,
    avatar_url: profileData?.avatar_url ?? null,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <AppSidebar user={userProps} />

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 h-12 shrink-0 px-3 border-b border-border bg-card">
        <MobileSidebar user={userProps} />
        <span className="font-bold text-sm">CollabBoard</span>
      </div>

      <main className="flex-1 overflow-hidden bg-muted">
        {children}
      </main>
    </div>
  );
}
