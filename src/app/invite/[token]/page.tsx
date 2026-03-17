import { acceptInviteAction } from '@/entities/workspace/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const result = await acceptInviteAction(token);

  if (result?.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold text-destructive">Invalid Invite</h1>
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <Link href="/workspaces" className="text-sm text-primary hover:underline">
            Go to workspaces
          </Link>
        </div>
      </div>
    );
  }

  redirect('/workspaces');
}
