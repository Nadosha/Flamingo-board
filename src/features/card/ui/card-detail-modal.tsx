'use client';

import { useState, useEffect, useTransition } from 'react';
import { Calendar, Trash2, User, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
  getCardWithRelationsAction,
  updateCardAction,
  deleteCardAction,
  addCommentAction,
} from '@/entities/card/actions';
import { formatRelativeTime, getInitials } from '@/shared/lib/utils';

interface Props {
  cardId: string;
  boardMembers: Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>;
  onClose: () => void;
  onCardDeleted: (cardId: string) => void;
}

type CardDetail = Awaited<ReturnType<typeof getCardWithRelationsAction>>;

export function CardDetailModal({ cardId, onClose, onCardDeleted }: Props) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getCardWithRelationsAction(cardId).then((data) => {
      setCard(data);
      setDescription(data?.description ?? '');
      setLoading(false);
    });
  }, [cardId]);

  function handleSaveDescription() {
    if (!card) return;
    startTransition(async () => {
      await updateCardAction(card.id, { description });
      setCard((prev) => prev ? { ...prev, description } : prev);
      setEditingDescription(false);
    });
  }

  function handleAddComment() {
    const trimmed = comment.trim();
    if (!trimmed || !card) return;
    startTransition(async () => {
      await addCommentAction(card.id, trimmed);
      setComment('');
      // Refresh card data for activity
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
                  {/* Labels */}
                  {card.card_labels && card.card_labels.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                        Labels
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {(card.card_labels as Array<{ label_id: string; label: { name: string; color: string } }>).map(({ label_id, label }) => (
                          <Badge
                            key={label_id}
                            style={{ backgroundColor: label.color, color: '#fff', border: 'none' }}
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignees */}
                  {card.card_assignees && card.card_assignees.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                        Members
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(card.card_assignees as Array<{ user_id: string; profile: { full_name: string | null; avatar_url: string | null } | null }>).map(({ user_id, profile }) => (
                          <div key={user_id} className="flex items-center gap-1.5 text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={profile?.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(profile?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{profile?.full_name ?? 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Due date */}
                  {card.due_date && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                        Due Date
                      </Label>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(card.due_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                      Description
                    </Label>
                    {editingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a more detailed description…"
                          rows={4}
                          autoFocus
                          className="text-sm"
                        />
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
                              setDescription(card.description ?? '');
                              setEditingDescription(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingDescription(true)}
                        className="min-h-[60px] text-sm text-muted-foreground bg-secondary/50 rounded-md px-3 py-2 cursor-pointer hover:bg-secondary transition-colors"
                      >
                        {card.description || 'Add a more detailed description…'}
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

                    {/* Add comment */}
                    <div className="space-y-2 mb-4">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write a comment…"
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

                    {/* Activity list */}
                    <div className="space-y-3">
                      {(card.card_activities as Array<{
                        id: string;
                        type: string;
                        content: string | null;
                        created_at: string;
                        profile: { full_name: string | null; avatar_url: string | null } | null;
                      }>)
                        ?.sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                        )
                        .map((activity) => (
                          <div key={activity.id} className="flex gap-2.5 text-sm">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={activity.profile?.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[9px]">
                                {getInitials(activity.profile?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium">
                                {activity.profile?.full_name ?? 'Unknown'}
                              </span>{' '}
                              {activity.type === 'card_commented' ? (
                                <div className="mt-1 bg-secondary rounded-md px-3 py-2 text-sm">
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
              </ScrollArea>

              {/* Sidebar actions */}
              <div className="w-36 flex-shrink-0 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </p>
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
