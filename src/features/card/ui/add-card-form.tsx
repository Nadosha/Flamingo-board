'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { createCardAction } from '@/entities/card/actions';
import type { CardWithRelations } from '@/shared/types';

interface Props {
  columnId: string;
  position: number;
  onAdded: (card: CardWithRelations) => void;
  onCancel: () => void;
}

export function AddCardForm({ columnId, position, onAdded, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createCardAction(columnId, trimmed, position);
      if (result?.card) {
        onAdded({ ...result.card, assignees: [], labels: [] });
        setTitle('');
        textareaRef.current?.focus();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-1">
      <Textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for this card…"
        className="resize-none min-h-0 text-sm"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex gap-1.5">
        <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
          Add card
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
