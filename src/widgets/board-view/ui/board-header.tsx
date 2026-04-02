"use client";

import { useState } from "react";
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

interface Props {
  board: Board;
}

export function BoardHeader({ board }: Props) {
  const [showPrioritize, setShowPrioritize] = useState(false);
  const [showStandup, setShowStandup] = useState(false);

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
      />
      <StandupPanel
        boardId={board.id}
        open={showStandup}
        onClose={() => setShowStandup(false)}
      />
    </>
  );
}
