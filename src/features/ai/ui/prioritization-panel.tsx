'use client';

import { useState, useTransition } from 'react';
import { Sparkles, X, ArrowUp, ArrowRight, ArrowDown, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { prioritizeBoardAction } from '@/features/ai/actions';

interface RankedCard {
  title: string;
  reasoning: string;
  score: number;
  card: any;
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  high:   <ArrowUp className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />,
  medium: <ArrowRight className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />,
  low:    <ArrowDown className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />,
};

interface Props {
  boardId: string;
  open: boolean;
  onClose: () => void;
  onCardClick?: (cardId: string) => void;
  result: { rankedCards: RankedCard[]; summary: string } | null;
  onResult: (r: { rankedCards: RankedCard[]; summary: string }) => void;
  onReanalyze?: () => void;
}

export function PrioritizationPanel({ boardId, open, onClose, onCardClick, result, onResult, onReanalyze }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFetch() {
    setError(null);
    startTransition(async () => {
      const res = await prioritizeBoardAction(boardId);
      if (res.error) { setError(res.error); return; }
      onResult(res.result!);
    });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> Prioritize Your Day
          </SheetTitle>
        </SheetHeader>

        {!result && !isPending && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Sparkles className="h-10 w-10 text-violet-300 dark:text-violet-700" />
            <p className="text-sm text-muted-foreground max-w-xs">
              The AI will analyze all tasks on the board considering priority, age, due dates, and recent activity — then tell you what to focus on today.
            </p>
            <Button onClick={handleFetch} className="bg-violet-600 hover:bg-violet-700 text-white">
              Analyze board
            </Button>
          </div>
        )}

        {isPending && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground">Analyzing tasks…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-center gap-2">
            <X className="h-4 w-4 flex-shrink-0" /> {error}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={handleFetch}>Retry</Button>
          </div>
        )}

        {result && !isPending && (
          <div className="space-y-4">
            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/40 px-4 py-3 text-sm text-violet-800 dark:text-violet-200">
              {result.summary}
            </div>

            <div className="space-y-3">
              {result.rankedCards.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg border border-border bg-card p-3 space-y-1.5',
                    item.card?.id && onCardClick
                      ? 'cursor-pointer hover:bg-accent hover:border-violet-300/60 transition-colors'
                      : '',
                  )}
                  onClick={() => item.card?.id && onCardClick?.(item.card.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 pt-0.5">#{i + 1}</span>
                    {item.card?.priority && (PRIORITY_ICON[item.card.priority] ?? null)}
                    <p className="text-sm font-medium leading-snug flex-1">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">{item.reasoning}</p>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={() => { onReanalyze?.(); handleFetch(); }}>
              Re-analyze
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
