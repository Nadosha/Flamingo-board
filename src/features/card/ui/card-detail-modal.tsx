"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Trash2,
  MessageSquare,
  Eye,
  Pencil,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  getCardWithRelationsAction,
  updateCardAction,
  deleteCardAction,
  addCommentAction,
  addCardAssigneeAction,
  removeCardAssigneeAction,
  addCardLabelAction,
  removeCardLabelAction,
  getBoardMembersAction,
  getBoardLabelsAction,
  createLabelAction,
  toggleSubtaskAction,
} from "@/entities/card/actions";
import { CardAiChat } from "@/features/ai/ui/card-ai-chat";
import { formatRelativeTime, getInitials } from "@/shared/lib/utils";

type BoardMember = {
  user_id: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};
type BoardLabel = { id: string; name: string; color: string };
type CardAssignee = {
  user_id: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
};
type CardLabelEntry = {
  label_id: string;
  label: { name: string; color: string };
};
type ActivityEntry = {
  id: string;
  type: string;
  content: string | null;
  created_at: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
};

interface Props {
  cardId: string;
  boardId: string;
  onClose: () => void;
  onCardDeleted: (cardId: string) => void;
  onBoardRefresh?: () => void;
}

type CardDetail = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | null;
  position: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
  assignees: CardAssignee[];
  labels: CardLabelEntry[];
  card_activities?: ActivityEntry[];
  subtasks?: Array<{ title: string; done: boolean }>;
};

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  medium: {
    label: "Medium",
    dot: "bg-yellow-400",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  low: {
    label: "Low",
    dot: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
};

export function CardDetailModal({
  cardId,
  boardId,
  onClose,
  onCardDeleted,
  onBoardRefresh,
}: Props) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [boardLabels, setBoardLabels] = useState<BoardLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [mdPreview, setMdPreview] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [comment, setComment] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#0079bf");
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [isPending, startTransition] = useTransition();

  function normalizeCard(data: CardDetail | null): CardDetail | null {
    if (!data) return null;
    return {
      ...data,
      assignees: (data as any).assignees ?? [],
      labels: (data as any).labels ?? [],
      card_activities: (data as any).card_activities ?? [],
      priority: (data as any).priority ?? null,
    };
  }

  useEffect(() => {
    Promise.all([
      getCardWithRelationsAction(cardId),
      getBoardMembersAction(boardId),
      getBoardLabelsAction(boardId),
    ]).then(([data, members, labels]) => {
      const normalized = normalizeCard(data);
      setCard(normalized);
      setDescription(normalized?.description ?? "");
      setDueDate(normalized?.due_date ? normalized.due_date.split("T")[0] : "");
      setBoardMembers(members);
      setBoardLabels(labels);
      setLoading(false);
    });
  }, [cardId, boardId]);

  function handleSaveDescription() {
    if (!card) return;
    startTransition(async () => {
      await updateCardAction(card.id, { description });
      setCard((prev) => (prev ? { ...prev, description } : prev));
      setEditingDescription(false);
    });
  }

  function handleSaveDueDate(value: string) {
    if (!card) return;
    startTransition(async () => {
      const due = value || null;
      await updateCardAction(card.id, { due_date: due });
      setCard((prev) => (prev ? { ...prev, due_date: due } : prev));
    });
  }

  function handleSetPriority(priority: "low" | "medium" | "high" | null) {
    if (!card) return;
    startTransition(async () => {
      await updateCardAction(card.id, { priority });
      setCard((prev) => (prev ? { ...prev, priority } : prev));
    });
  }

  function handleAddAssignee(member: BoardMember) {
    if (!card) return;
    startTransition(async () => {
      await addCardAssigneeAction(card.id, member.user_id);
      setCard((prev) => {
        if (!prev) return prev;
        const existing = prev.assignees ?? [];
        return {
          ...prev,
          assignees: [
            ...existing,
            { user_id: member.user_id, profile: member.profile },
          ],
        };
      });
    });
  }

  function handleRemoveAssignee(userId: string) {
    if (!card) return;
    startTransition(async () => {
      await removeCardAssigneeAction(card.id, userId);
      setCard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assignees: prev.assignees.filter((a) => a.user_id !== userId),
        };
      });
    });
  }

  function handleAddLabel(label: BoardLabel) {
    if (!card) return;
    startTransition(async () => {
      await addCardLabelAction(card.id, label.id);
      setCard((prev) => {
        if (!prev) return prev;
        const existing = prev.labels ?? [];
        return {
          ...prev,
          labels: [
            ...existing,
            {
              label_id: label.id,
              label: { name: label.name, color: label.color },
            },
          ],
        };
      });
    });
  }

  function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    startTransition(async () => {
      const result = await createLabelAction(
        boardId,
        newLabelName.trim(),
        newLabelColor,
      );
      if ("label" in result && result.label) {
        const created = result.label;
        setBoardLabels((prev) => [...prev, created]);
        handleAddLabel(created);
        setNewLabelName("");
        setCreatingLabel(false);
      }
    });
  }

  function handleRemoveLabel(labelId: string) {
    if (!card) return;
    startTransition(async () => {
      await removeCardLabelAction(card.id, labelId);
      setCard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          labels: prev.labels.filter((l) => l.label_id !== labelId),
        };
      });
    });
  }

  function handleAddComment() {
    const trimmed = comment.trim();
    if (!trimmed || !card) return;
    startTransition(async () => {
      await addCommentAction(card.id, trimmed);
      setComment("");
      const updated = await getCardWithRelationsAction(cardId);
      setCard(normalizeCard(updated));
    });
  }

  function handleDelete() {
    if (!card) return;
    startTransition(async () => {
      await deleteCardAction(card.id);
      onCardDeleted(card.id);
      onClose();
    });
  }

  function handleToggleSubtask(index: number) {
    if (!card) return;
    startTransition(async () => {
      await toggleSubtaskAction(card.id, index);
      setCard((prev) => {
        if (!prev) return prev;
        const subtasks = [...(prev.subtasks ?? [])];
        subtasks[index] = { ...subtasks[index], done: !subtasks[index].done };
        return { ...prev, subtasks };
      });
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {loading || !card ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <DialogHeader className="px-6 pt-5 pb-3 shrink-0 border-b border-border/60">
              <DialogTitle className="text-lg pr-6">{card.title}</DialogTitle>
            </DialogHeader>

            {/* Three-column layout */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* ── Column 1: Main content ──────────────────────────────── */}
              <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4">
                <div className="space-y-5 max-w-prose">
                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Description
                      </Label>
                      {editingDescription && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={mdPreview ? "secondary" : "ghost"}
                            className="h-6 px-2 text-xs"
                            onClick={() => setMdPreview(true)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            variant={!mdPreview ? "secondary" : "ghost"}
                            className="h-6 px-2 text-xs"
                            onClick={() => setMdPreview(false)}
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingDescription ? (
                      <div className="space-y-2">
                        {mdPreview ? (
                          <div className="min-h-[100px] text-sm bg-secondary/50 rounded-md px-3 py-2 prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {description || "*No description*"}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description… Markdown is supported"
                            rows={5}
                            autoFocus
                            className="text-sm font-mono"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveDescription}
                            disabled={isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDescription(card.description ?? "");
                              setEditingDescription(false);
                              setMdPreview(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingDescription(true)}
                        className="min-h-[60px] text-sm bg-secondary/50 rounded-md px-3 py-2 cursor-pointer hover:bg-secondary transition-colors"
                      >
                        {card.description ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {card.description}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Add a more detailed description…
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Subtasks checklist */}
                  {card.subtasks && card.subtasks.length > 0 && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                            Subtasks (
                            {card.subtasks.filter((s) => s.done).length}/
                            {card.subtasks.length})
                          </Label>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-secondary rounded-full mb-3 overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${Math.round((card.subtasks.filter((s) => s.done).length / card.subtasks.length) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          {card.subtasks.map((subtask, i) => (
                            <button
                              key={i}
                              onClick={() => handleToggleSubtask(i)}
                              disabled={isPending}
                              className="w-full flex items-start gap-2.5 text-left rounded-md px-2 py-1.5 hover:bg-secondary/60 transition-colors group"
                            >
                              <div
                                className={`mt-0.5 h-4 w-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${subtask.done ? "bg-green-500 border-green-500" : "border-muted-foreground/40 group-hover:border-muted-foreground"}`}
                              >
                                {subtask.done && (
                                  <svg
                                    className="h-2.5 w-2.5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`text-sm leading-snug ${subtask.done ? "line-through text-muted-foreground" : ""}`}
                              >
                                {subtask.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Activity */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Activity
                    </Label>
                    <div className="space-y-2 mb-4">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        placeholder="Write a comment… (Enter to send, Shift+Enter for new line)"
                        rows={2}
                        className="text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={isPending || !comment.trim()}
                      >
                        Comment
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(card.card_activities as ActivityEntry[])
                        ?.sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                        )
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="flex gap-2.5 text-sm"
                          >
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage
                                src={activity.profile?.avatar_url ?? undefined}
                              />
                              <AvatarFallback className="text-[9px]">
                                {getInitials(activity.profile?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium">
                                {activity.profile?.full_name ?? "Unknown"}
                              </span>{" "}
                              {activity.type === "card_commented" ? (
                                <div className="mt-1 bg-secondary rounded-md px-3 py-2 text-sm whitespace-pre-wrap">
                                  {activity.content}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {activity.content}
                                </span>
                              )}
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {formatRelativeTime(activity.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Column 2: Metadata sidebar ──────────────────────────── */}
              <div className="w-44 flex-shrink-0 border-l border-border/60 overflow-y-auto px-4 py-4 space-y-4 text-sm">
                {/* Priority */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Priority
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 border border-input bg-background hover:bg-secondary transition-colors text-xs">
                        {card.priority ? (
                          <>
                            <span
                              className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[card.priority].dot}`}
                            />
                            <span
                              className={PRIORITY_CONFIG[card.priority].text}
                            >
                              {PRIORITY_CONFIG[card.priority].label}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No priority
                          </span>
                        )}
                        <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-1" align="start">
                      {(["high", "medium", "low"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleSetPriority(p)}
                          className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[p].dot}`}
                          />
                          {PRIORITY_CONFIG[p].label}
                        </button>
                      ))}
                      {card.priority && (
                        <button
                          onClick={() => handleSetPriority(null)}
                          className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent transition-colors text-muted-foreground border-t border-border/40 mt-1 pt-1.5"
                        >
                          <X className="h-3 w-3" /> Clear
                        </button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator />

                {/* Due Date */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Due Date
                  </p>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={(e) => handleSaveDueDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {dueDate && (
                    <button
                      onClick={() => {
                        setDueDate("");
                        handleSaveDueDate("");
                      }}
                      className="mt-1 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>

                <Separator />

                {/* Members */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Members
                  </p>
                  <div className="space-y-1.5">
                    {card.assignees.map(({ user_id, profile }) => (
                      <div
                        key={user_id}
                        className="flex items-center justify-between gap-1"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar className="h-5 w-5 flex-shrink-0">
                            <AvatarImage
                              src={profile?.avatar_url ?? undefined}
                            />
                            <AvatarFallback className="text-[9px]">
                              {getInitials(profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">
                            {profile?.full_name ?? "Unknown"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignee(user_id)}
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {boardMembers.filter(
                      (m) =>
                        !card.assignees.some((a) => a.user_id === m.user_id),
                    ).length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors">
                            <Plus className="h-3 w-3" /> Add member
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                          {boardMembers
                            .filter(
                              (m) =>
                                !card.assignees.some(
                                  (a) => a.user_id === m.user_id,
                                ),
                            )
                            .map((member) => (
                              <button
                                key={member.user_id}
                                onClick={() => handleAddAssignee(member)}
                                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={
                                      member.profile?.avatar_url ?? undefined
                                    }
                                  />
                                  <AvatarFallback className="text-[9px]">
                                    {getInitials(member.profile?.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                {member.profile?.full_name ?? "Unknown"}
                              </button>
                            ))}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Labels */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Labels
                  </p>
                  <div className="space-y-1.5">
                    {card.labels.map(({ label_id, label }) => (
                      <div
                        key={label_id}
                        className="flex items-center justify-between gap-1"
                      >
                        <Badge
                          style={{
                            backgroundColor: label.color,
                            color: "#fff",
                            border: "none",
                          }}
                          className="text-xs truncate max-w-[100px]"
                        >
                          {label.name}
                        </Badge>
                        <button
                          onClick={() => handleRemoveLabel(label_id)}
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Popover
                      onOpenChange={(open) => {
                        if (!open) {
                          setCreatingLabel(false);
                          setNewLabelName("");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors">
                          <Plus className="h-3 w-3" /> Add label
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-2" align="start">
                        {boardLabels
                          .filter(
                            (l) =>
                              !card.labels.some((cl) => cl.label_id === l.id),
                          )
                          .map((label) => (
                            <button
                              key={label.id}
                              onClick={() => handleAddLabel(label)}
                              className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                            >
                              <span
                                className="h-3 w-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                            </button>
                          ))}
                        {!creatingLabel ? (
                          <button
                            onClick={() => setCreatingLabel(true)}
                            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1 border-t border-border/40 pt-2"
                          >
                            <Plus className="h-3 w-3" /> Create new label
                          </button>
                        ) : (
                          <div className="mt-2 border-t border-border/40 pt-2 space-y-2">
                            <input
                              autoFocus
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateLabel();
                                if (e.key === "Escape") setCreatingLabel(false);
                              }}
                              placeholder="Label name…"
                              className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-border/60"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "#0079bf",
                                "#61bd4f",
                                "#f2d600",
                                "#ff9f1a",
                                "#eb5a46",
                                "#c377e0",
                                "#00c2e0",
                                "#51e898",
                                "#ff78cb",
                                "#344563",
                              ].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setNewLabelColor(c)}
                                  className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: c,
                                    outline:
                                      newLabelColor === c
                                        ? `2px solid ${c}`
                                        : "none",
                                    outlineOffset: "2px",
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleCreateLabel}
                                disabled={!newLabelName.trim() || isPending}
                                className="flex-1 text-xs py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                              >
                                Create
                              </button>
                              <button
                                onClick={() => {
                                  setCreatingLabel(false);
                                  setNewLabelName("");
                                }}
                                className="px-2 text-xs py-1 rounded-md border border-border hover:bg-secondary transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                {/* Delete */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete card
                </Button>
              </div>

              {/* ── Column 3: AI Chat ───────────────────────────────────── */}
              <div className="w-80 flex-shrink-0 border-l border-border/60 flex flex-col min-h-0">
                <CardAiChat
                  cardId={cardId}
                  onPriorityApplied={(p) =>
                    setCard((prev) =>
                      prev ? { ...prev, priority: p as any } : prev,
                    )
                  }
                  onCardsCreated={async () => {
                    // Reload card to pick up new subtasks
                    const updated = await getCardWithRelationsAction(cardId);
                    setCard(normalizeCard(updated));
                    onBoardRefresh?.();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
