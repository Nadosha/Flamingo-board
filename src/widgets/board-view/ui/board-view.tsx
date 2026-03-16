'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { ColumnCard } from '@/features/column/ui/column-card';
import { AddColumnForm } from '@/features/column/ui/add-column-form';
import { CardDetailModal } from '@/features/card/ui/card-detail-modal';
import { PresenceBar } from '@/features/presence/ui/presence-bar';
import { useRealtimeBoard } from '@/features/realtime/hooks/use-realtime-board';
import { usePresence } from '@/features/realtime/hooks/use-presence';
import { reorderCardsAction } from '@/entities/card/actions';
import { reorderColumnsAction } from '@/entities/column/actions';
import type { BoardWithColumns, ColumnWithCards, CardWithRelations } from '@/shared/types';

interface Props {
  initialBoard: BoardWithColumns;
}

export function BoardView({ initialBoard }: Props) {
  const [board, setBoard] = useState<BoardWithColumns>(initialBoard);
  const [addingColumn, setAddingColumn] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Real-time sync
  useRealtimeBoard(board.id, (updated) => setBoard(updated));

  // Presence
  const { presentUsers } = usePresence(board.id);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, type } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      if (type === 'COLUMN') {
        const cols = Array.from(board.columns);
        const [moved] = cols.splice(source.index, 1);
        cols.splice(destination.index, 0, moved);
        const updated = cols.map((c, i) => ({ ...c, position: i }));

        // Optimistic update
        setBoard((prev) => ({ ...prev, columns: updated }));

        // Persist
        await reorderColumnsAction(
          updated.map(({ id, position }) => ({ id, position })),
        );
        return;
      }

      // CARD drag
      const sourceCol = board.columns.find(
        (c) => c.id === source.droppableId,
      )!;
      const destCol = board.columns.find(
        (c) => c.id === destination.droppableId,
      )!;

      const sourceCards = Array.from(sourceCol.cards);
      const [movedCard] = sourceCards.splice(source.index, 1);

      let newColumns: ColumnWithCards[];

      if (source.droppableId === destination.droppableId) {
        sourceCards.splice(destination.index, 0, movedCard);
        const updated = sourceCards.map((c, i) => ({ ...c, position: i }));
        newColumns = board.columns.map((col) =>
          col.id === sourceCol.id ? { ...col, cards: updated } : col,
        );
      } else {
        const destCards = Array.from(destCol.cards);
        destCards.splice(destination.index, 0, {
          ...movedCard,
          column_id: destCol.id,
        });
        const updatedSource = sourceCards.map((c, i) => ({ ...c, position: i }));
        const updatedDest = destCards.map((c, i) => ({
          ...c,
          position: i,
          column_id: destCol.id,
        }));
        newColumns = board.columns.map((col) => {
          if (col.id === sourceCol.id) return { ...col, cards: updatedSource };
          if (col.id === destCol.id) return { ...col, cards: updatedDest };
          return col;
        });
      }

      // Optimistic update
      setBoard((prev) => ({ ...prev, columns: newColumns }));

      // Gather all affected cards for batch update
      const affectedCards: Array<{ id: string; column_id: string; position: number }> = [];
      newColumns.forEach((col) => {
        if (
          col.id === source.droppableId ||
          col.id === destination.droppableId
        ) {
          col.cards.forEach((c) =>
            affectedCards.push({ id: c.id, column_id: col.id, position: c.position }),
          );
        }
      });

      await reorderCardsAction(affectedCards);
    },
    [board],
  );

  const handleCardAdded = useCallback(
    (columnId: string, card: CardWithRelations) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === columnId
            ? { ...col, cards: [...col.cards, card] }
            : col,
        ),
      }));
    },
    [],
  );

  const handleColumnAdded = useCallback((col: ColumnWithCards) => {
    setBoard((prev) => ({
      ...prev,
      columns: [...prev.columns, col],
    }));
  }, []);

  const handleColumnDeleted = useCallback((columnId: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.id !== columnId),
    }));
  }, []);

  const handleCardDeleted = useCallback((cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }));
  }, []);

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: `${board.color}15` }}
    >
      {/* Presence bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-border/50">
        <span className="text-xs text-muted-foreground">
          {board.columns.length} column{board.columns.length !== 1 ? 's' : ''}
        </span>
        <PresenceBar users={presentUsers} />
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="board"
            type="COLUMN"
            direction="horizontal"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="inline-flex gap-3 p-4 h-full items-start"
              >
                {board.columns.map((column, index) => (
                  <ColumnCard
                    key={column.id}
                    column={column}
                    index={index}
                    boardId={board.id}
                    onCardAdded={handleCardAdded}
                    onCardClick={setSelectedCardId}
                    onColumnDeleted={handleColumnDeleted}
                    onCardDeleted={handleCardDeleted}
                  />
                ))}
                {provided.placeholder}

                {/* Add column */}
                {addingColumn ? (
                  <AddColumnForm
                    boardId={board.id}
                    position={board.columns.length}
                    onAdded={handleColumnAdded}
                    onCancel={() => setAddingColumn(false)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="flex-shrink-0 w-64 flex items-center gap-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add column
                  </button>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Card detail modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          boardMembers={[]}
          onClose={() => setSelectedCardId(null)}
          onCardDeleted={handleCardDeleted}
        />
      )}
    </div>
  );
}
