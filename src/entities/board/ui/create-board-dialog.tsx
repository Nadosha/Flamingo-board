'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import { createBoardAction } from '../actions';

const BOARD_COLORS = [
  '#0079bf', '#d29034', '#519839', '#b04632',
  '#89609e', '#cd5a91', '#4bbf6b', '#00aecc',
];

export function CreateBoardDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('workspace_id', workspaceId);
    formData.set('color', color);
    startTransition(async () => {
      const result = await createBoardAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-28 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground transition-colors text-sm"
      >
        <Plus className="h-5 w-5" />
        Create board
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Preview */}
            <div
              className="w-full h-20 rounded-lg transition-colors"
              style={{ backgroundColor: color }}
            />

            <div className="space-y-1.5">
              <Label>Background color</Label>
              <div className="flex gap-2 flex-wrap">
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-8 w-8 rounded-md ring-offset-background transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? '2px solid hsl(var(--primary))' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="board-name">Board name</Label>
              <Input
                id="board-name"
                name="name"
                placeholder="My Board"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
