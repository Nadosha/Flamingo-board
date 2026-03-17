'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { MoreHorizontal, Trash2, Pencil, Check, X } from 'lucide-react';
import { CardItem } from '@/features/card/ui/card-item';
import { AddCardForm } from '@/features/card/ui/add-card-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { updateColumnAction, deleteColumnAction } from '@/entities/column/actions';
import type { ColumnWithCards, CardWithRelations } from '@/shared/types';

interface Props {
  column: ColumnWithCards;
  index: number;
  boardId: string;
  onCardAdded: (columnId: string, card: CardWithRelations) => void;
  onCardClick: (cardId: string) => void;
  onColumnDeleted: (columnId: string) => void;
  onCardDeleted: (cardId: string) => void;
}

export function ColumnCard({
  column,
  index,
  boardId,
  onCardAdded,
  onCardClick,
  onColumnDeleted,
  onCardDeleted,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.name);
  const [addingCard, setAddingCard] = useState(false);
  const [isPending, startTransition] = useTransition();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  function handleTitleSave() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === column.name) {
      setTitle(column.name);
      setEditingTitle(false);
      return;
    }
    startTransition(async () => {
      await updateColumnAction(column.id, { name: trimmed });
      setEditingTitle(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteColumnAction(column.id);
      onColumnDeleted(column.id);
    });
  }

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 w-68 flex flex-col rounded-inner bg-secondary/60 backdrop-blur-sm shadow-soft max-h-[calc(100vh-160px)] ${
            snapshot.isDragging ? 'shadow-card-hover rotate-1' : ''
          }`}
        >
          {/* Column header */}
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing"
          >
            {editingTitle ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') {
                      setTitle(column.name);
                      setEditingTitle(false);
                    }
                  }}
                  className="h-7 text-sm font-semibold"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleTitleSave}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setTitle(column.name);
                    setEditingTitle(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                className="flex-1 text-left text-sm font-semibold hover:text-primary transition-colors truncate pr-1"
                onClick={() => setEditingTitle(true)}
              >
                {column.name}
              </button>
            )}

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-background rounded-full">
                {column.cards.length}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingTitle(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Cards */}
          <Droppable droppableId={column.id} type="CARD">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`flex-1 overflow-y-auto px-2 space-y-2 py-1 min-h-[8px] rounded-lg transition-colors ${
                  dropSnapshot.isDraggingOver ? 'bg-primary/5' : ''
                }`}
              >
                {column.cards.map((card, cardIndex) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    onClick={() => onCardClick(card.id)}
                    onDeleted={onCardDeleted}
                  />
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add card */}
          <div className="px-2 pb-2">
            {addingCard ? (
              <AddCardForm
                columnId={column.id}
                position={column.cards.length}
                onAdded={(card) => {
                  onCardAdded(column.id, card);
                  setAddingCard(false);
                }}
                onCancel={() => setAddingCard(false)}
              />
            ) : (
              <button
                onClick={() => setAddingCard(true)}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-background transition-colors flex items-center gap-1.5"
              >
                <span className="text-base leading-none">+</span> Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
