# Agent Log — DevLog AI Feature

> A running log of every AI agent invocation, prompt structure, and design decision made during implementation.

---

## Overview

This document records the agentic behaviour implemented in `backend/src/ai/ai.service.ts` and the reasoning behind each design choice.

---

## Agents

### 1. Board Prioritizer (`prioritizeBoard`)

**Endpoint:** `POST /api/ai/boards/:boardId/prioritize`

**Trigger:** User clicks *AI Assist → Prioritize day* in the board header.

**Multi-step process:**

| Step | What happens |
|------|-------------|
| 1 | Fetch full board data (columns + cards) via `CardsService.getBoardWithColumns` |
| 2 | Compute a numeric urgency score per card: `priority_weight + age_days/7 + overdue×5` where `priority_weight` maps `high→3`, `medium→2`, `low→1`, `null→0` |
| 3 | Sort cards by score, assemble a JSON payload, call GPT with a system prompt asking for concise, action-oriented reasoning |
| 4 | Return a ranked list `{ cards: [{ _id, title, urgencyScore, reasoning }], summary }` |

**Prompt design:** The system prompt asks the model to act as a "senior project manager" and explain *why* each card is important in ≤ 15 words. Using a small token budget keeps latency low and outputs scannable.

**Why a scoring pre-pass?** Seeding the LLM with computed scores gives it a factual anchor, reducing hallucinated priority judgments and making the ranking deterministic enough to trust.

---

### 2. Task Decomposer (`decomposeCard`)

**Endpoint:** `POST /api/ai/cards/:cardId/decompose`

**Trigger:** User clicks *Generate subtasks* chip in the card AI chat, or the chat agent decides to decompose.

**Multi-step process:**

| Step | What happens |
|------|-------------|
| 1 | Fetch full card (title + description) |
| 2 | Send to GPT with a *clarity check* — does the card have enough detail to decompose? |
| 3a | If not: return a `{ clarifyingQuestion }` response; the UI shows this as a chat message |
| 3b | If yes: generate 2–5 concrete subtask titles |
| 4 | If `createCards: true` in the request body, call `CardsService.createCard` for each subtask in the same column, then emit `broadcastBoardUpdate` |

**Design note:** The two-phase check (clarity → decompose) prevents generating vague sub-tasks like "Fix it" or "Look into this" when the parent card is itself under-specified. This is the core "agentic" loop — the agent can ask for more information rather than blindly executing.

---

### 3. Standup Generator (`generateStandup`)

**Endpoint:** `POST /api/ai/boards/:boardId/standup`

**Trigger:** User clicks *AI Assist → Generate standup* in the board header.

**Multi-step process:**

| Step | What happens |
|------|-------------|
| 1 | Fetch full board data |
| 2 | Categorize cards into `done` (last column), `inProgress` (middle columns), `blockers` (overdue or cards with "block"/"stuck" in title) |
| 3 | Prompt GPT with categorized lists; ask for a Slack-style async standup in three sections: ✅ Done, 🔄 In Progress, 🚨 Blockers |
| 4 | Return `{ message, blockers: [{ title }] }` |

**Prompt design:** The system prompt explicitly tells the model to use emoji bullet points, keep the tone professional but human, and limit the message to ~200 words. The structured output format (three labelled sections) makes it copy-pasteable directly into Slack or Teams.

---

### 4. Card Chat (`cardChat`)

**Endpoint:** `POST /api/ai/cards/:cardId/chat`

**Trigger:** User types in the AI chat panel inside a card's detail modal.

**Architecture:**

The card's full context (title, description, column, assignees, priority, due date) is injected into the **system prompt** once per conversation. The user's message history is forwarded as `messages[]` to maintain context across turns.

The model is instructed that it *may* respond with a JSON action block instead of plain text:

```json
{"action":"createSubtasks","subtasks":["Title 1","Title 2"]}
{"action":"setPriority","priority":"high"}
```

When the backend detects this pattern, it executes the action (creates cards / updates priority) and returns a confirmation message alongside the result. This lets the model drive mutations through natural conversation ("break this into subtasks" → model emits action → cards created automatically).

**Security note:** The JSON action parser uses a strict parsing step and only allows the two whitelisted action types. Arbitrary code execution is not possible.

---

## Model Configuration

| Setting | Value |
|---------|-------|
| Provider | OpenAI |
| Default model | `gpt-4o-mini` |
| Override | `OPENAI_MODEL` env var |
| Temperature | `0.3` (prioritizer, standup) / `0.5` (decomposer, chat) |
| Max tokens | Not capped (relies on model default; responses are typically <500 tokens) |

`gpt-4o-mini` was chosen for the right balance of speed, cost, and reasoning quality for task-management payloads. All prompts are < 2 000 input tokens, keeping latency under 2 s in typical usage.

---

## Error Handling

- If `OPENAI_API_KEY` is missing, the service throws `InternalServerErrorException` with a clear message.
- If OpenAI returns a non-200, the NestJS service logs the error and surfaces `"AI service unavailable"` to the client.
- The frontend action wrappers (`src/features/ai/actions.ts`) always return `{ error?: string, result? }` — the UI shows the error inline without crashing.
