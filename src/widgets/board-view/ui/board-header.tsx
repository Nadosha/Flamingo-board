"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Sparkles, ChevronDown } from "lucide-react";
import type { Board } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { PrioritizationPanel } from "@/features/ai/ui/prioritization-panel";
import { StandupPanel } from "@/features/ai/ui/standup-panel";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadCachedResult(boardId: string, key: string) {
  try {
    const raw = localStorage.getItem(`${key}_${boardId}`);
    if (!raw) return null;
    const { result, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(`${key}_${boardId}`);
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

function saveCachedResult(boardId: string, key: string, result: any) {
  try {
    localStorage.setItem(`${key}_${boardId}`, JSON.stringify({ result, ts: Date.now() }));
  } catch {}
}

function clearCachedResult(boardId: string, key: string) {
  try { localStorage.removeItem(`${key}_${boardId}`); } catch {}
}

interface Props {
  board: Board;
  onCardClick?: (cardId: string) => void;
}

export function BoardHeader({ board, onCardClick }: Props) {
  const [showPrioritize, setShowPrioritize] = useState(false);
  const [showStandup, setShowStandup] = useState(false);
  const [prioritizeResult, setPrioritizeResult] = useState<{ rankedCards: any[]; summary: string } | null>(null);
  const [standupResult, setStandupResult] = useState<{ message: string; blockers: Array<{ title: string }> } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = loadCachedResult(board.id, 'prioritize');
    if (cached) setPrioritizeResult(cached);
    const cachedStandup = loadCachedResult(board.id, 'standup');
    if (cachedStandup) setStandupResult(cachedStandup);
  }, [board.id]);

  return (
    <>
      <header
        className="flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-sm z-10"
        style={{ borderBottom: `2px solid ${board.color}30` }}
      >
        <Link
          href={`/workspaces`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Workspaces
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-lg"
            style={{ backgroundColor: board.color }}
          />
          <span className="font-semibold text-sm">{board.name}</span>
        </div>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                AI Assist
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowPrioritize(true)} className="gap-2 cursor-pointer text-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Prioritize day
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowStandup(true)} className="gap-2 cursor-pointer text-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Generate standup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <PrioritizationPanel
        boardId={board.id}
        open={showPrioritize}
        onClose={() => setShowPrioritize(false)}
        onCardClick={(id) => { setShowPrioritize(false); onCardClick?.(id); }}
        result={prioritizeResult}
        onResult={(r) => { setPrioritizeResult(r); saveCachedResult(board.id, 'prioritize', r); }}
        onReanalyze={() => { clearCachedResult(board.id, 'prioritize'); setPrioritizeResult(null); }}
      />
      <StandupPanel
        boardId={board.id}
        open={showStandup}
        onClose={() => setShowStandup(false)}
        result={standupResult}
        onResult={(r) => { setStandupResult(r); saveCachedResult(board.id, 'standup', r); }}
        onRegenerate={() => { clearCachedResult(board.id, 'standup'); setStandupResult(null); }}
      />
    </>
  );
}
