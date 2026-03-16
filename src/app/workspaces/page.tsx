import Link from 'next/link';
import { LayoutGrid, Settings } from 'lucide-react';
import { getWorkspacesAction } from '@/entities/workspace/actions';
import { getBoardsAction } from '@/entities/board/actions';
import { CreateWorkspaceDialog } from '@/entities/workspace/ui/create-workspace-dialog';
import { CreateBoardDialog } from '@/entities/board/ui/create-board-dialog';
import { InviteButton } from '@/entities/workspace/ui/invite-button';
import type { Board } from '@/shared/types';

export default async function WorkspacesPage() {
  const memberships = await getWorkspacesAction();

  return (
    <div className="overflow-auto h-full">
      <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a workspace to view boards
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <LayoutGrid className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No workspaces yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first workspace or ask to be invited.
          </p>
          <CreateWorkspaceDialog />
        </div>
      ) : (
        <div className="space-y-10">
          {memberships.map(({ workspace, role }) => {
            const ws = workspace as { id: string; name: string; slug: string; owner_id: string; created_at: string } | null;
            if (!ws) return null;
            return (
              <WorkspaceSection
                key={ws.id}
                workspace={ws}
                role={role}
              />
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}

async function WorkspaceSection({
  workspace,
  role,
}: {
  workspace: { id: string; name: string; slug: string };
  role: string;
}) {
  const boards = await getBoardsAction(workspace.id);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            {workspace.name[0].toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold">{workspace.name}</h2>
          <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-secondary rounded">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(role === 'owner' || role === 'admin') && (
            <InviteButton workspaceId={workspace.id} />
          )}
          <Link
            href={`/workspaces/${workspace.id}/settings`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {boards.map((board: Board) => (
          <Link
            key={board.id}
            href={`/workspaces/${workspace.id}/boards/${board.id}`}
            className="group relative h-28 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            style={{ backgroundColor: board.color }}
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-semibold text-sm line-clamp-2 drop-shadow">
                {board.name}
              </p>
            </div>
          </Link>
        ))}
        <CreateBoardDialog workspaceId={workspace.id} />
      </div>
    </section>
  );
}
