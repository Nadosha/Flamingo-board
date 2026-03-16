'use client';

import { useState, useCallback, useRef } from 'react';
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Plus, Filter, RotateCcw, X, Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { ColumnCard } from '@/features/column/ui/column-card';
import { AddColumnForm } from '@/features/column/ui/add-column-form';
import { CardDetailModal } from '@/features/card/ui/card-detail-modal';
import { PresenceBar } from '@/features/presence/ui/presence-bar';
import { useRealtimeBoard } from '@/features/realtime/hooks/use-realtime-board';
import { usePresence } from '@/features/realtime/hooks/use-presence';
import { reorderCardsAction } from '@/entities/card/actions';
import { reorderColumnsAction } from '@/entities/column/actions';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import type { BoardWithColumns, ColumnWithCards, CardWithRelations } from '@/shared/types';

interface Props {
  initialBoard: BoardWithColumns;
}

interface Filters {
  assigneeId: string | null;
  labelId: string | null;
  search: string;
}

export function BoardView({ initialBoard }: Props) {
  const [board, setBoard] = useState<BoardWithColumns>(initialBoard);
  const [addingColumn, setAddingColumn] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ assigneeId: null, labelId: null, search: '' });
  const [showFilters, setShowFilters] = useState(false);
  // Undo stack — stores previous board states
  const undoStack = useRef<BoardWithColumns[]>([]);

  // Real-time sync
  useRealtimeBoard(board.id, (updated) => setBoard(updated));

  // Presence
  const { presentUsers } = usePresence(board.id);

  // Collect all unique assignees and labels from current board
  const allAssignees = Array.from(
    new Map(
      board.columns.flatMap((c) =>
        c.cards.flatMap((card) =>
          ((card as unknown as { card_assignees?: Array<{ user_id: string; profile: { full_name: string | null } | null }> }).card_assignees ?? []).map((a) => [
            a.user_id,
            { user_id: a.user_id, full_name: a.profile?.full_name ?? 'Unknown' },
          ])
        )
      )
    ).values()
  );

  const allLabels = Array.from(
    new Map(
      board.columns.flatMap((c) =>
        c.cards.flatMap((card) =>
          ((card as unknown as { card_labels?: Array<{ label_id: string; label: { name: string; color: string } }> }).card_labels ?? []).map((l) => [
            l.label_id,
            { label_id: l.label_id, name: l.label.name, color: l.label.color },
          ])
        )
      )
    ).values()
  );

  const hasActiveFilters = filters.assigneeId !== null || filters.labelId !== null || filters.search.trim() !== '';

  function filterCards(column: ColumnWithCards): ColumnWithCards {
    if (!hasActiveFilters) return column;
    const query = filters.search.trim().toLowerCase();
    return {
      ...column,
      cards: column.cards.filter((card) => {
        const c = card as unknown as {
          card_assignees?: Array<{ user_id: string }>;
          card_labels?: Array<{ label_id: string }>;
        };
        if (query && !card.title.toLowerCase().includes(query)) return false;
        if (filters.assigneeId && !c.card_assignees?.some((a) => a.user_id === filters.assigneeId)) return false;
        if (filters.labelId && !c.card_labels?.some((l) => l.label_id === filters.labelId)) return false;
        return true;
      }),
    };
  }

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, type } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      // Save current state to undo stack before mutating
      undoStack.current = [...undoStack.current.slice(-9), board];

      if (type === 'COLUMN') {
        const cols = Array.from(board.columns);
        const [moved] = cols.splice(source.index, 1);
        cols.splice(destination.index, 0, moved);
        const updated = cols.map((c, i) => ({ ...c, position: i }));
        setBoard((prev) => ({ ...prev, columns: updated }));
        await reorderColumnsAction(updated.map(({ id, position }) => ({ id, position })));
        return;
      }

      const sourceCol = board.columns.find((c) => c.id === source.droppableId)!;
      const destCol = board.columns.find((c) => c.id === destination.droppableId)!;
      const sourceCards = Array.from(sourceCol.cards);
      const [movedCard] = sourceCards.splice(source.index, 1);

      let newColumns: ColumnWithCards[];

      if (source.droppableId === destination.droppableId) {
        sourceCards.splice(destination.index, 0, movedCard);
        const updated = sourceCards.map((c, i) => ({ ...c, position: i }));
        newColumns = board.columns.map((col) => col.id === sourceCol.id ? { ...col, cards: updated } : col);
      } else {
        const destCards = Array.from(destCol.cards);
        destCards.splice(destination.index, 0, { ...movedCard, column_id: destCol.id });
        const updatedSource = sourceCards.map((c, i) => ({ ...c, position: i }));
        const updatedDest = destCards.map((c, i) => ({ ...c, position: i, column_id: destCol.id }));
        newColumns = board.columns.map((col) => {
          if (col.id === sourceCol.id) return { ...col, cards: updatedSource };
          if (col.id === destCol.id) return { ...col, cards: updatedDest };
          return col;
        });
      }

      setBoard((prev) => ({ ...prev, columns: newColumns }));

      const affectedCards: Array<{ id: string; column_id: string; position: number }> = [];
      newColumns.forEach((col) => {
        if (col.id === source.droppableId || col.id === destination.droppableId) {
          col.cards.forEach((c) => affectedCards.push({ id: c.id, column_id: col.id, position: c.position }));
        }
      });
      await reorderCardsAction(affectedCards);
    },
    [board],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    setBoard(prev);
  }, []);

  const handleCardAdded = useCallback((columnId: string, card: CardWithRelations) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
      ),
    }));
  }, []);

  const handleColumnAdded = useCallback((col: ColumnWithCards) => {
    setBoard((prev) => ({ ...prev, columns: [...prev.columns, col] }));
  }, []);

  const handleColumnDeleted = useCallback((columnId: string) => {
    setBoard((prev) => ({ ...prev, columns: prev.columns.filter((c) => c.id !== columnId) }));
  }, []);

  const handleCardDeleted = useCallback((cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })),
    }));
  }, []);

  const filteredColumns = board.columns.map(filterCards);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: `${board.color}15` }}>
      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-border/50 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {board.columns.length} column{board.columns.length !== 1 ? 's' : ''}
          </span>
          {/* Undo */}
          {undoStack.current.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleUndo}>
              <RotateCcw className="h-3.5 w-3.5" />
              Undo
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search input — always visible */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search cards…"
              className="h-7 pl-7 pr-6 text-xs w-40 focus:w-56 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Active filter badges (assignee / label only) */}
          {(filters.assigneeId || filters.labelId) && (
            <div className="flex items-center gap-1 flex-wrap">
              {filters.assigneeId && (
                <Badge variant="secondary" className="gap-1 text-xs pr-1">
                  {allAssignees.find((a) => a.user_id === filters.assigneeId)?.full_name ?? 'Assignee'}
                  <button onClick={() => setFilters((f) => ({ ...f, assigneeId: null }))} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.labelId && (
                <Badge variant="secondary" className="gap-1 text-xs pr-1">
                  {allLabels.find((l) => l.label_id === filters.labelId)?.name ?? 'Label'}
                  <button onClick={() => setFilters((f) => ({ ...f, labelId: null }))} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-muted-foreground" onClick={() => setFilters({ assigneeId: null, labelId: null, search: '' })}>
                Clear all
              </Button>
            </div>
          )}

          <Button
            size="sm"
            variant={showFilters ? 'secondary' : 'ghost'}
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>

          <PresenceBar users={presentUsers} />
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="px-4 py-2 border-b border-border/50 bg-secondary/20 flex flex-wrap gap-4 text-xs">
          {/* Assignee filter */}
          {allAssignees.length > 0 && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground uppercase tracking-wide">Assignee</span>
              <div className="flex flex-wrap gap-1">
                {allAssignees.map((a) => (
                  <button
                    key={a.user_id}
                    onClick={() => setFilters((f) => ({ ...f, assigneeId: f.assigneeId === a.user_id ? null : a.user_id }))}
                    className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${filters.assigneeId === a.user_id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
                  >
                    {a.full_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Label filter */}
          {allLabels.length > 0 && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground uppercase tracking-wide">Label</span>
              <div className="flex flex-wrap gap-1">
                {allLabels.map((l) => (
                  <button
                    key={l.label_id}
                    onClick={() => setFilters((f) => ({ ...f, labelId: f.labelId === l.label_id ? null : l.label_id }))}
                    className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${filters.labelId === l.label_id ? 'border-2' : 'border-border hover:border-primary'}`}
                    style={filters.labelId === l.label_id ? { backgroundColor: l.color, color: '#fff', borderColor: l.color } : {}}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: l.color }} />
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="inline-flex gap-3 p-4 h-full items-start"
              >
                {filteredColumns.map((column, index) => (
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

                {!filters.assigneeId && !filters.labelId && !filters.search && (
                  addingColumn ? (
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
                  )
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
          boardId={board.id}
          onClose={() => setSelectedCardId(null)}
          onCardDeleted={handleCardDeleted}
        />
      )}
    </div>
  );
}


