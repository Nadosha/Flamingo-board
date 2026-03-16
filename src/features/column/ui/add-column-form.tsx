'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { createColumnAction } from '@/entities/column/actions';
import type { ColumnWithCards } from '@/shared/types';

interface Props {
  boardId: string;
  position: number;
  onAdded: (column: ColumnWithCards) => void;
  onCancel: () => void;
}

export function AddColumnForm({ boardId, position, onAdded, onCancel }: Props) {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createColumnAction(boardId, trimmed, position);
      if (result?.column) {
        onAdded({ ...result.column, cards: [] });
      }
    });
  }

  return (
    <div className="flex-shrink-0 w-64 rounded-xl bg-secondary/80 p-2 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Column name"
          className="resize-none min-h-0 h-10 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="flex gap-1.5">
          <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
            Add column
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
