'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Copy, Check, X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { generateStandupAction } from '@/features/ai/actions';

interface Props {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function StandupPanel({ boardId, open, onClose }: Props) {
  const [result, setResult] = useState<{ message: string; blockers: Array<{ title: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFetch() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const res = await generateStandupAction(boardId);
      if (res.error) { setError(res.error); return; }
      setResult(res.result!);
    });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> Generate Standup
          </SheetTitle>
        </SheetHeader>

        {!result && !isPending && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Sparkles className="h-10 w-10 text-violet-300 dark:text-violet-700" />
            <p className="text-sm text-muted-foreground max-w-xs">
              The AI will generate a Slack-style async standup based on what was done today, what's in progress, and any blockers.
            </p>
            <Button onClick={handleFetch} className="bg-violet-600 hover:bg-violet-700 text-white">
              Generate standup
            </Button>
          </div>
        )}

        {isPending && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground">Generating standup…</p>
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
            <div className="relative rounded-lg border border-border bg-secondary/50 px-4 py-4">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{result.message}</pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-3 right-3 h-7 px-2 text-xs"
                onClick={handleCopy}
              >
                {copied ? <><Check className="h-3.5 w-3.5 mr-1 text-green-500" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>}
              </Button>
            </div>

            {result.blockers.length > 0 && (
              <div className="rounded-lg border border-orange-200/60 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400 mb-2">
                  🚨 Potential blockers
                </p>
                <ul className="space-y-1">
                  {result.blockers.map((b, i) => (
                    <li key={i} className="text-sm text-orange-800 dark:text-orange-300">• {b.title}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleFetch}>
                Regenerate
              </Button>
              <Button size="sm" onClick={handleCopy} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                {copied ? '✓ Copied!' : 'Copy to clipboard'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
