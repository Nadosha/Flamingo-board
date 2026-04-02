import { getBoardWithColumnsAction } from "@/entities/board/actions";
import { BoardPageClient } from "@/widgets/board-view/ui/board-page-client";

interface Props {
  params: Promise<{ workspaceId: string; boardId: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { boardId } = await params;
  const board = await getBoardWithColumnsAction(boardId);

  return <BoardPageClient board={board} />;
}
