import { getBoardWithColumnsAction } from '@/entities/board/actions';
import { BoardView } from '@/widgets/board-view/ui/board-view';
import { BoardHeader } from '@/widgets/board-view/ui/board-header';

interface Props {
  params: Promise<{ workspaceId: string; boardId: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { workspaceId, boardId } = await params;
  const board = await getBoardWithColumnsAction(boardId);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BoardHeader board={board} workspaceId={workspaceId} />
      <div className="flex-1 overflow-hidden">
        <BoardView initialBoard={board} />
      </div>
    </div>
  );
}
