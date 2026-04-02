import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CardsService } from '../cards/cards.service';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly cardsService: CardsService,
  ) {
    this.openai = new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY') });
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-5.4-mini';
  }

  private async chat(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    const res = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.4,
    });
    return res.choices[0].message.content ?? '';
  }

  // ─── Agent A: Prioritization ────────────────────────────────────────────────
  async prioritizeBoard(boardId: string) {
    // Step 1: Fetch board data from DB
    const board = await this.cardsService.getBoardWithColumns(boardId);

    // Step 2: Compute a numerical score per card
    const now = Date.now();
    const scored = board.columns.flatMap((col) =>
      col.cards.map((card) => {
        const ageDays = (now - new Date(card.created_at).getTime()) / 86_400_000;
        const priorityWeight = { high: 3, medium: 2, low: 1 }[card.priority as string] ?? 0;
        const overdue = card.due_date && new Date(card.due_date).getTime() < now ? 5 : 0;
        const score = priorityWeight + ageDays / 7 + overdue;
        return { card, column: col.name, score };
      }),
    );

    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 15);

    // Step 3: LLM call with scored context
    const context = top
      .map(
        (s, i) =>
          `${i + 1}. [Score: ${s.score.toFixed(1)}] "${s.card.title}" in column "${s.column}"` +
          (s.card.priority ? ` | priority: ${s.card.priority}` : '') +
          (s.card.due_date ? ` | due: ${s.card.due_date.split('T')[0]}` : '') +
          (s.card.description ? ` | desc: ${s.card.description.slice(0, 80)}` : ''),
      )
      .join('\n');

    const raw = await this.chat([
      {
        role: 'system',
        content:
          'You are an engineering team assistant. Given a scored list of tasks, produce a prioritized recommendations for what to work on today. For each top task explain WHY it should be done first in 1 concise sentence. Output valid JSON only.',
      },
      {
        role: 'user',
        content: `Board: "${board.name}"\n\nScored tasks (higher score = more urgent):\n${context}\n\nReturn JSON: { "rankedCards": [{ "title": "...", "reasoning": "..." }], "summary": "one sentence overview" }`,
      },
    ]);

    let parsed: { rankedCards: Array<{ title: string; reasoning: string }>; summary: string };
    try {
      parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch {
      parsed = { rankedCards: [], summary: raw };
    }

    // Merge scores back
    return {
      rankedCards: parsed.rankedCards.map((r, i) => ({
        ...r,
        score: top[i]?.score ?? 0,
        card: top[i]?.card ?? null,
      })),
      summary: parsed.summary,
    };
  }

  // ─── Agent B: Decomposition ─────────────────────────────────────────────────
  async decomposeCard(
    cardId: string,
    userId: string,
    opts: { clarificationAnswer?: string; createCards?: boolean },
  ) {
    // Step 1: Fetch card
    const card = await this.cardsService.getCardWithRelations(cardId);
    if (!card) throw new Error('Card not found');

    const cardContext = `Title: "${card.title}"\nDescription: ${card.description ?? '(none)'}`;

    // Step 2: Clarity check (skip if clarification already provided)
    if (!opts.clarificationAnswer) {
      const clarityRaw = await this.chat([
        {
          role: 'system',
          content:
            'You are an engineering PM assistant. Evaluate if a task is clear enough to break down into subtasks. Output JSON only.',
        },
        {
          role: 'user',
          content: `${cardContext}\n\nIs this task clear enough to decompose into concrete subtasks? If NOT, ask ONE clarifying question. JSON: { "isClear": true/false, "clarifyingQuestion": "..." }`,
        },
      ]);

      let clarity: { isClear: boolean; clarifyingQuestion?: string };
      try {
        clarity = JSON.parse(clarityRaw.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      } catch {
        clarity = { isClear: true };
      }

      if (!clarity.isClear && clarity.clarifyingQuestion) {
        return { needsClarification: true, question: clarity.clarifyingQuestion };
      }
    }

    // Step 3: Generate subtasks
    const extraContext = opts.clarificationAnswer
      ? `\nAdditional context from user: "${opts.clarificationAnswer}"`
      : '';

    const subtasksRaw = await this.chat([
      {
        role: 'system',
        content:
          'You are an engineering PM assistant. Break down the task into 3-7 concrete, actionable subtasks for a developer. Each subtask should be a short imperative sentence. Output JSON only.',
      },
      {
        role: 'user',
        content: `${cardContext}${extraContext}\n\nReturn JSON: { "subtasks": ["subtask 1", "subtask 2", ...] }`,
      },
    ]);

    let { subtasks }: { subtasks: string[] } = { subtasks: [] };
    try {
      ({ subtasks } = JSON.parse(subtasksRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '')));
    } catch {
      subtasks = subtasksRaw.split('\n').filter((l) => l.trim().length > 0).slice(0, 7);
    }

    // Step 4 (optional): Save subtasks to parent card
    let createdCardIds: string[] = [];
    if (opts.createCards && subtasks.length > 0) {
      const subtaskDocs = subtasks.map((title) => ({ title, done: false }));
      await this.cardsService.updateCard(cardId, userId, { subtasks: subtaskDocs } as any);
    }

    return { needsClarification: false, subtasks, createdCardIds };
  }

  // ─── Agent C: Standup Generator ──────────────────────────────────────────────
  async generateStandup(boardId: string) {
    // Step 1: Fetch board with all cards
    const board = await this.cardsService.getBoardWithColumns(boardId);

    const now = Date.now();
    const oneDayAgo = now - 86_400_000;
    const twoDaysAgo = now - 2 * 86_400_000;

    // Step 2: Categorise cards
    const lastCol = board.columns[board.columns.length - 1];
    const doneColName = lastCol?.name ?? 'Done';

    const doneToday: string[] = [];
    const inProgress: string[] = [];
    const blockers: string[] = [];

    for (const col of board.columns) {
      for (const card of col.cards) {
        const updatedAt = new Date(card.updated_at).getTime();
        const isDoneCol = col.name === doneColName;
        const isOverdue = card.due_date && new Date(card.due_date).getTime() < now;
        const noRecentActivity = updatedAt < twoDaysAgo;

        if (isDoneCol && updatedAt > oneDayAgo) {
          doneToday.push(card.title);
        } else if (!isDoneCol) {
          inProgress.push(card.title);
          if (isOverdue || noRecentActivity) {
            blockers.push(card.title);
          }
        }
      }
    }

    // Step 3: LLM generates standup message
    const message = await this.chat([
      {
        role: 'system',
        content:
          'You are a helpful assistant that writes concise async standups for engineering teams. Use Slack-friendly formatting (no markdown headers, use emoji). Keep it under 150 words.',
      },
      {
        role: 'user',
        content:
          `Board: "${board.name}"\n` +
          `Done today: ${doneToday.length ? doneToday.map((t) => `"${t}"`).join(', ') : 'nothing yet'}\n` +
          `In progress: ${inProgress.length ? inProgress.map((t) => `"${t}"`).join(', ') : 'nothing'}\n` +
          `Blockers: ${blockers.length ? blockers.map((t) => `"${t}"`).join(', ') : 'none'}\n\n` +
          'Write a Slack standup update.',
      },
    ]);

    return { message, blockers: blockers.map((title) => ({ title })) };
  }

  // ─── Card-context AI Chat ────────────────────────────────────────────────────
  async cardChat(
    cardId: string,
    userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ) {
    const card = await this.cardsService.getCardWithRelations(cardId);
    if (!card) throw new Error('Card not found');

    const systemPrompt =
      `You are an AI assistant embedded in a task management tool. ` +
      `You help the user with the current task. Be concise and practical.\n\n` +
      `Current task:\nTitle: "${card.title}"\nDescription: ${card.description ?? '(none)'}\n` +
      `Priority: ${card.priority ?? 'not set'}\nDue: ${card.due_date ?? 'not set'}\n` +
      `Column: (task is in the system)\n\n` +
      `When the user asks to generate subtasks, decompose the task or asks for a priority suggestion, ` +
      `respond with actionable output and include a JSON block at the end if creating cards is needed: ` +
      `{"action": "createSubtasks", "subtasks": ["..."]} or {"action": "setPriority", "priority": "high|medium|low"}.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    const response = await this.chat(messages);

    // Check for embedded action JSON
    const actionMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
    let action: { action: string; subtasks?: string[]; priority?: string } | null = null;
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[0]);
      } catch {
        // no-op
      }
    }

    // Execute action if createSubtasks
    let createdCardIds: string[] = [];
    if (action?.action === 'createSubtasks' && action.subtasks?.length) {
      const created = await Promise.all(
        action.subtasks.map((title, i) =>
          this.cardsService.createCard(userId, {
            column_id: card.column_id,
            title,
            position: card.position + i + 1,
          }),
        ),
      );
      createdCardIds = created.map((c) => c.id);
    }

    // Execute action if setPriority
    if (action?.action === 'setPriority' && action.priority) {
      await this.cardsService.updateCard(cardId, userId, {
        priority: action.priority as 'low' | 'medium' | 'high',
      });
    }

    const displayText = action
      ? response.replace(/\{[\s\S]*"action"[\s\S]*\}/, '').trim()
      : response;

    return {
      reply: displayText,
      action: action?.action ?? null,
      createdCardIds,
      appliedPriority: action?.action === 'setPriority' ? action.priority : null,
    };
  }
}
