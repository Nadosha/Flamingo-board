'use client';

import { useState, useEffect, useTransition } from 'react';
import { Calendar, Trash2, MessageSquare, Eye, Pencil, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
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
} from '@/entities/card/actions';
import { formatRelativeTime, getInitials } from '@/shared/lib/utils';

type BoardMember = { user_id: string; profile: { id: string; full_name: string | null; avatar_url: string | null } | null };
type BoardLabel = { id: string; name: string; color: string };
type CardAssignee = { user_id: string; profile: { full_name: string | null; avatar_url: string | null } | null };
type CardLabelEntry = { label_id: string; label: { name: string; color: string } };
type ActivityEntry = { id: string; type: string; content: string | null; created_at: string; profile: { full_name: string | null; avatar_url: string | null } | null };

interface Props {
  cardId: string;
  boardId: string;
  onClose: () => void;
  onCardDeleted: (cardId: string) => void;
}

type CardDetail = Awaited<ReturnType<typeof getCardWithRelationsAction>>;

export function CardDetailModal({ cardId, boardId, onClose, onCardDeleted }: Props) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [boardLabels, setBoardLabels] = useState<BoardLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [mdPreview, setMdPreview] = useState(false);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      getCardWithRelationsAction(cardId),
      getBoardMembersAction(boardId),
      getBoardLabelsAction(boardId),
    ]).then(([data, members, labels]) => {
      setCard(data);
      setDescription(data?.description ?? '');
      setDueDate(data?.due_date ? data.due_date.split('T')[0] : '');
      setBoardMembers(members);
      setBoardLabels(labels);
      setLoading(false);
    });
  }, [cardId, boardId]);

  function handleSaveDescription() {
    if (!card) return;
    startTransition(async () => {
      await updateCardAction(card.id, { description });
      setCard((prev) => prev ? { ...prev, description } : prev);
      setEditingDescription(false);
    });
  }

  function handleSaveDueDate(value: string) {
    if (!card) return;
    startTransition(async () => {
      const due = value || null;
      await updateCardAction(card.id, { due_date: due });
      setCard((prev) => prev ? { ...prev, due_date: due } : prev);
    });
  }

  function handleAddAssignee(member: BoardMember) {
    if (!card) return;
    startTransition(async () => {
      await addCardAssigneeAction(card.id, member.user_id);
      setCard((prev) => {
        if (!prev) return prev;
        const existing = (prev.card_assignees as CardAssignee[]) ?? [];
        return { ...prev, card_assignees: [...existing, { user_id: member.user_id, profile: member.profile }] } as unknown as CardDetail;
      });
    });
  }

  function handleRemoveAssignee(userId: string) {
    if (!card) return;
    startTransition(async () => {
      await removeCardAssigneeAction(card.id, userId);
      setCard((prev) => {
        if (!prev) return prev;
        return { ...prev, card_assignees: (prev.card_assignees as CardAssignee[]).filter((a) => a.user_id !== userId) } as unknown as CardDetail;
      });
    });
  }

  function handleAddLabel(label: BoardLabel) {
    if (!card) return;
    startTransition(async () => {
      await addCardLabelAction(card.id, label.id);
      setCard((prev) => {
        if (!prev) return prev;
        const existing = (prev.card_labels as CardLabelEntry[]) ?? [];
        return { ...prev, card_labels: [...existing, { label_id: label.id, label: { name: label.name, color: label.color } }] } as unknown as CardDetail;
      });
    });
  }

  function handleRemoveLabel(labelId: string) {
    if (!card) return;
    startTransition(async () => {
      await removeCardLabelAction(card.id, labelId);
      setCard((prev) => {
        if (!prev) return prev;
        return { ...prev, card_labels: (prev.card_labels as CardLabelEntry[]).filter((l) => l.label_id !== labelId) } as unknown as CardDetail;
      });
    });
  }

  function handleAddComment() {
    const trimmed = comment.trim();
    if (!trimmed || !card) return;
    startTransition(async () => {
      await addCommentAction(card.id, trimmed);
      setComment('');
      const updated = await getCardWithRelationsAction(cardId);
      setCard(updated);
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        {loading || !card ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg pr-6">{card.title}</DialogTitle>
            </DialogHeader>

            <div className="flex gap-4 flex-1 overflow-hidden">
              {/* Main content */}
              <ScrollArea className="flex-1">
                <div className="space-y-5 pr-2">
                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Description
                      </Label>
                      {editingDescription && (
                        <div className="flex gap-1">
                          <Button size="sm" variant={mdPreview ? 'secondary' : 'ghost'} className="h-6 px-2 text-xs" onClick={() => setMdPreview(true)}>
                            <Eye className="h-3 w-3 mr-1" /> Preview
                          </Button>
                          <Button size="sm" variant={!mdPreview ? 'secondary' : 'ghost'} className="h-6 px-2 text-xs" onClick={() => setMdPreview(false)}>
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingDescription ? (
                      <div className="space-y-2">
                        {mdPreview ? (
                          <div className="min-h-[100px] text-sm bg-secondary/50 rounded-md px-3 py-2 prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{description || '*No description*'}</ReactMarkdown>
                          </div>
                        ) : (
                          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description… Markdown is supported" rows={5} autoFocus className="text-sm font-mono" />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveDescription} disabled={isPending}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => { setDescription(card.description ?? ''); setEditingDescription(false); setMdPreview(false); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setEditingDescription(true)} className="min-h-[60px] text-sm bg-secondary/50 rounded-md px-3 py-2 cursor-pointer hover:bg-secondary transition-colors">
                        {card.description ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.description}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Add a more detailed description…</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Activity */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Activity
                    </Label>
                    <div className="space-y-2 mb-4">
                      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment…" rows={2} className="text-sm resize-none" />
                      <Button size="sm" onClick={handleAddComment} disabled={isPending || !comment.trim()}>Comment</Button>
                    </div>
                    <div className="space-y-3">
                      {(card.card_activities as ActivityEntry[])
                        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((activity) => (
                          <div key={activity.id} className="flex gap-2.5 text-sm">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={activity.profile?.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[9px]">{getInitials(activity.profile?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium">{activity.profile?.full_name ?? 'Unknown'}</span>{' '}
                              {activity.type === 'card_commented' ? (
                                <div className="mt-1 bg-secondary rounded-md px-3 py-2 text-sm">{activity.content}</div>
                              ) : (
                                <span className="text-muted-foreground">{activity.content}</span>
                              )}
                              <div className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(activity.created_at)}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Right sidebar */}
              <div className="w-44 flex-shrink-0 space-y-4 overflow-y-auto text-sm">

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
                      onClick={() => { setDueDate(''); handleSaveDueDate(''); }}
                      className="mt-1 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>

                <Separator />

                {/* Members */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Members</p>
                  <div className="space-y-1.5">
                    {(card.card_assignees as CardAssignee[]).map(({ user_id, profile }) => (
                      <div key={user_id} className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar className="h-5 w-5 flex-shrink-0">
                            <AvatarImage src={profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[9px]">{getInitials(profile?.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">{profile?.full_name ?? 'Unknown'}</span>
                        </div>
                        <button onClick={() => handleRemoveAssignee(user_id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {boardMembers.filter((m) => !(card.card_assignees as CardAssignee[]).some((a) => a.user_id === m.user_id)).length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors">
                            <Plus className="h-3 w-3" /> Add member
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                          {boardMembers
                            .filter((m) => !(card.card_assignees as CardAssignee[]).some((a) => a.user_id === m.user_id))
                            .map((member) => (
                              <button
                                key={member.user_id}
                                onClick={() => handleAddAssignee(member)}
                                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.profile?.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-[9px]">{getInitials(member.profile?.full_name)}</AvatarFallback>
                                </Avatar>
                                {member.profile?.full_name ?? 'Unknown'}
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Labels</p>
                  <div className="space-y-1.5">
                    {(card.card_labels as CardLabelEntry[]).map(({ label_id, label }) => (
                      <div key={label_id} className="flex items-center justify-between gap-1">
                        <Badge style={{ backgroundColor: label.color, color: '#fff', border: 'none' }} className="text-xs truncate max-w-[100px]">
                          {label.name}
                        </Badge>
                        <button onClick={() => handleRemoveLabel(label_id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {boardLabels.filter((l) => !(card.card_labels as CardLabelEntry[]).some((cl) => cl.label_id === l.id)).length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors">
                            <Plus className="h-3 w-3" /> Add label
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1" align="start">
                          {boardLabels
                            .filter((l) => !(card.card_labels as CardLabelEntry[]).some((cl) => cl.label_id === l.id))
                            .map((label) => (
                              <button
                                key={label.id}
                                onClick={() => handleAddLabel(label)}
                                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                              >
                                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                                {label.name}
                              </button>
                            ))}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Delete */}
                <Button variant="destructive" size="sm" className="w-full justify-start" onClick={handleDelete} disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete card
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

