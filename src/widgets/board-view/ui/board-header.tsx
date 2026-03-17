"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Board } from "@/shared/types";

interface Props {
  board: Board;
}

export function BoardHeader({ board }: Props) {
  return (
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
    </header>
  );
}
