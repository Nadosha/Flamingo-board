import { createClient } from '@/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/widgets/sidebar/ui/app-sidebar';

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

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        user={{
          id: user.id,
          email: user.email ?? '',
          full_name: profileData?.full_name ?? null,
          avatar_url: profileData?.avatar_url ?? null,
        }}
      />
      <main className="flex-1 overflow-hidden bg-muted">
        {children}
      </main>
    </div>
  );
}
