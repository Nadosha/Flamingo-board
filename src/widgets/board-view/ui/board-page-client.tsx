'use client';

import { useState } from 'react';
import { BoardHeader } from './board-header';
import { BoardView } from './board-view';
import type { BoardWithColumns } from '@/shared/types';

interface Props {
  board: BoardWithColumns;
}

export function BoardPageClient({ board }: Props) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BoardHeader board={board} onCardClick={setOpenCardId} />
      <div className="flex-1 overflow-hidden">
        <BoardView initialBoard={board} externalCardId={openCardId} onExternalCardClose={() => setOpenCardId(null)} />
      </div>
    </div>
  );
}
