'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/lib/utils';
import {
  cardChatAction,
  decomposeCardAction,
} from '@/features/ai/actions';
import {
  getCardChatHistoryAction,
  appendCardChatMessageAction,
} from '@/entities/card/actions';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string | null;
  createdCardIds?: string[];
  appliedPriority?: string | null;
};

const QUICK_ACTIONS = [
  { label: 'Generate subtasks', prompt: null },  // handled by sendDecompose
  { label: 'Suggest priority', prompt: 'Analyze this task and suggest the appropriate priority level (low/medium/high) with reasoning.' },
  { label: 'Write standup update', prompt: 'Write a brief async standup update for this task that I can share in Slack.' },
  { label: 'Spot risks', prompt: 'What are the potential risks or blockers for this task?' },
];

interface Props {
  cardId: string;
  onPriorityApplied?: (priority: string) => void;
  onCardsCreated?: () => void;
}

export function CardAiChat({ cardId, onPriorityApplied, onCardsCreated }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted chat history on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { history } = await getCardChatHistoryAction(cardId);
      if (!cancelled && history.length > 0) {
        setMessages(
          history.map((m) => ({
            id: crypto.randomUUID(),
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        );
      }
      if (!cancelled) setIsLoadingHistory(false);
    })();
    return () => { cancelled = true; };
  }, [cardId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addMessage(msg: Omit<Message, 'id'>, persist = false) {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { ...msg, id }]);
    if (persist && (msg.role === 'user' || msg.role === 'assistant')) {
      appendCardChatMessageAction(cardId, msg.role, msg.content);
    }
    return id;
  }

  function sendMessage(text: string) {
    if (!text.trim() || isPending) return;
    const userMsg = text.trim();
    setInput('');
    addMessage({ role: 'user', content: userMsg }, true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    startTransition(async () => {
      const { result, error } = await cardChatAction(cardId, userMsg, history);
      if (error || !result) {
        addMessage({ role: 'assistant', content: error ?? 'Something went wrong. Please try again.' }, true);
        return;
      }

      addMessage({
        role: 'assistant',
        content: result.reply,
        action: result.action,
        createdCardIds: result.createdCardIds,
        appliedPriority: result.appliedPriority,
      }, true);

      if (result.appliedPriority) onPriorityApplied?.(result.appliedPriority);
      if (result.createdCardIds.length > 0) onCardsCreated?.();
    });
  }

  function sendDecompose() {
    if (isPending) return;
    addMessage({ role: 'user', content: 'Generate subtasks' }, true);
    startTransition(async () => {
      const { result, error } = await decomposeCardAction(cardId, { createCards: true });
      if (error || !result) {
        addMessage({ role: 'assistant', content: error ?? 'Something went wrong.' }, true);
        return;
      }
      if (result.needsClarification) {
        addMessage({ role: 'assistant', content: result.question ?? 'Please clarify the task first.' }, true);
        return;
      }
      const subtaskList = (result.subtasks ?? []).map((t, i) => `${i + 1}. ${t}`).join('\n');
      addMessage({
        role: 'assistant',
        content: subtaskList + '\n\n✅ Subtasks saved to this card — see the checklist above.',
        action: 'createSubtasks',
        createdCardIds: [],
      }, true);
      onCardsCreated?.();
    });
  }

  function handleCreateSubtasks(assistantMessageId: string, content: string) {
    // Extract subtasks from the message text
    const lines = content
      .split('\n')
      .map((l) => l.replace(/^[\d\-\*\.\)]+\s*/, '').trim())
      .filter((l) => l.length > 5 && l.length < 200);

    if (!lines.length) return;

    startTransition(async () => {
      const { result, error } = await decomposeCardAction(cardId, { createCards: true });
      if (error) {
        addMessage({ role: 'assistant', content: `❌ ${error}` });
        return;
      }
      if (result?.createdCardIds?.length) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, createdCardIds: result.createdCardIds ?? [] }
              : m,
          ),
        );
        onCardsCreated?.();
        addMessage({
          role: 'assistant',
          content: `✅ Created ${result.createdCardIds!.length} subtasks on the board.`,
        });
      }
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 shrink-0">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold">AI Assistant</span>
      </div>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2 shrink-0">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => a.prompt ? sendMessage(a.prompt) : sendDecompose()}
            disabled={isPending}
            className="text-xs px-2.5 py-1 rounded-full border border-violet-300/60 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
        {isLoadingHistory ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground mt-8 px-4">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-violet-300 dark:text-violet-700" />
            Ask the AI about this task or use the quick actions above.
          </div>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-secondary text-foreground rounded-tl-sm',
              )}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:leading-relaxed [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_code]:bg-black/10 [&_code]:dark:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/10 [&_pre]:dark:bg-white/10 [&_pre]:p-2 [&_pre]:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              )}

              {/* Action buttons on assistant messages */}
              {msg.role === 'assistant' && msg.action === 'createSubtasks' && msg.createdCardIds && msg.createdCardIds.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs"
                  disabled={isPending}
                  onClick={() => handleCreateSubtasks(msg.id, msg.content)}
                >
                  Create subtasks on board
                </Button>
              )}
              {msg.role === 'assistant' && msg.createdCardIds && msg.createdCardIds.length > 0 && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ {msg.createdCardIds.length} cards created
                </p>
              )}
              {msg.role === 'assistant' && msg.appliedPriority && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  ✓ Priority set to {msg.appliedPriority}
                </p>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex gap-2 justify-start">
            <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-border/60">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask anything about this task…"
            rows={2}
            className="resize-none text-sm"
            disabled={isPending}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={isPending || !input.trim()}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
