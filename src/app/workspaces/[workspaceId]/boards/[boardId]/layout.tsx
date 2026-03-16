import { createClient } from '@/shared/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function BoardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <div className="h-screen overflow-hidden">{children}</div>;
}
