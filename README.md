# 🦩 HolyMoly Board

A real-time collaborative Kanban board built with **Next.js 16**, **NestJS**, **MongoDB**, and **TypeScript**. Create workspaces, invite teammates, manage boards with drag-and-drop columns and cards, and see who's online — all in real time.

Includes a suite of **GPT-powered AI agents**: auto-prioritize your board by urgency, decompose vague tasks into concrete subtasks, generate a Slack-ready async standup in one click, and chat with an AI assistant scoped to any individual card — all without leaving the board.

## Features

- **Workspaces** — organize boards by team or project, invite members via shareable links
- **Kanban boards** — columns and cards with drag-and-drop reordering
- **Card details** — descriptions (Markdown), labels, assignees, comments, due dates
- **Real-time collaboration** — live board updates and presence indicators via Socket.IO
- **Auth** — email/password registration and login with JWT session persistence
- **AI Agents** — GPT-powered prioritization, task decomposition, async standup generation, and in-card AI chat

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js 16.1.6 (App Router, Server Actions) |
| Backend    | NestJS + MongoDB (Mongoose)                 |
| Realtime   | Socket.IO (WebSocket gateway)               |
| Auth       | JWT (httpOnly cookie)                       |
| Styling    | Tailwind CSS + shadcn/ui                    |
| Language   | TypeScript                                  |
| Deployment | Docker Compose (mongo + backend + frontend) |

---

## Requirements Coverage

| #                          | Requirement                                                      | Status  |
| -------------------------- | ---------------------------------------------------------------- | ------- |
| **Auth**                   |                                                                  |         |
| 1                          | Email/password registration and login                            | ✅ Done |
| 2                          | User profiles with avatars                                       | ✅ Done |
| 3                          | Invite-only workspaces via magic links                           | ✅ Done |
| **Database Schema**        |                                                                  |         |
| 4                          | Workspaces                                                       | ✅ Done |
| 5                          | Boards (belong to workspace)                                     | ✅ Done |
| 6                          | Columns (ordered within board)                                   | ✅ Done |
| 7                          | Cards (ordered within column, with assignees, labels, due dates) | ✅ Done |
| 8                          | Activity log per card                                            | ✅ Done |
| **Features**               |                                                                  |         |
| 9                          | Create/edit/delete boards and columns                            | ✅ Done |
| 10                         | Drag-and-drop cards between columns                              | ✅ Done |
| 11                         | Real-time sync across multiple browser tabs/users                | ✅ Done |
| 12                         | Presence indicators showing who's viewing the board              | ✅ Done |
| 13                         | Card detail modal with description and activity history          | ✅ Done |
| **Technical Requirements** |                                                                  |         |
| 14                         | Socket.IO WebSocket gateway for live updates                     | ✅ Done |
| 15                         | Optimistic drag-and-drop with conflict resolution                | ✅ Done |
| 16                         | @hello-pangea/dnd for drag interactions                          | ✅ Done |
| 17                         | TypeScript types shared across frontend and backend              | ✅ Done |
| **Bonus**                  |                                                                  |         |
| 18                         | Markdown editor in card detail                                   | ✅ Done |
| 19                         | Filter cards by assignee/label/due date                          | ✅ Done |
| **ТЗ — Базовий трекер**    |                                                                  |         |
| T1                         | CRUD для задач: title, description, status (todo/in-progress/done), priority (low/medium/high), createdAt | ✅ Done |
| T2                         | Список задач із фільтрацією за статусом і сортуванням за пріоритетом / датою | ✅ Done |
| T3                         | Зберігання між перезавантаженнями; вибір БД пояснено в README    | ✅ Done (MongoDB) |
| **ТЗ — AI-агенти**         |                                                                  |         |
| A                          | Агент пріоритизації: scoring pre-pass (вік + overdue + priority weight) → GPT ranks + reasoning | ✅ Done |
| B                          | Декомпозиція задачі: clarity check → subtasks → auto-create в board | ✅ Done |
| C                          | Генератор статус-апдейту: Slack-style async standup (✅ Done / 🔄 In Progress / 🚨 Blockers) | ✅ Done |
| D                          | Власна ідея: Card Chat — контекстний AI-чат у картці з виконанням дій (createSubtasks, setPriority) | ✅ Done |
| **ТЗ — Coding agent**      |                                                                  |         |
| CA1                        | UI scaffolded агентом (GitHub Copilot); компоненти, лейаут, стилізація | ✅ Done |
| CA2                        | AGENT_LOG.md: які задачі давав агенту, де допоміг, де переробляв | ✅ Done |
| **ТЗ — Здача**             |                                                                  |         |
| D1                         | Публічний GitHub репо                                            | ✅ Done |
| D2                         | README з інструкцією запуску та описом архітектури               | ✅ Done |
| D3                         | `.env.example` (root + backend) з усіма змінними без реальних значень | ✅ Done |
| D4                         | Локальний запуск: `docker compose up --build -d` або `npm install && npm run dev` | ✅ Done |

---

## Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js 20+](https://nodejs.org) (for local development only)

### Run with Docker (recommended)

```bash
git clone git@github.com:Nadosha/HolyMoly-board.git
cd HolyMoly-board
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000).

All three services start automatically: MongoDB, NestJS backend (`:4000`), Next.js frontend (`:3000`).

### Run in development mode

```bash
# 1. Start MongoDB
docker compose up mongo -d

# 2. Start backend
cd backend
npm install
npm run start:dev

# 3. Start frontend (new terminal)
cd ..
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Frontend (`.env.local`)

| Variable               | Default                     | Description                                |
| ---------------------- | --------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:4000/api` | Backend API URL (used by the browser)      |
| `NEXT_PUBLIC_APP_URL`  | `http://localhost:3000`     | Frontend base URL (for invite links)       |
| `BACKEND_INTERNAL_URL` | `http://backend:4000/api`   | Backend URL used server-side inside Docker |

### Backend (`backend/.env`)

| Variable         | Default                          | Description                      |
| ---------------- | -------------------------------- | -------------------------------- |
| `MONGODB_URI`    | `mongodb://mongo:27017/holymoly` | MongoDB connection string        |
| `JWT_SECRET`     | `change-me-in-production`        | Secret for signing JWT tokens    |
| `JWT_EXPIRES_IN` | `7d`                             | Token expiration                 |
| `FRONTEND_URL`   | `http://localhost:3000`          | Allowed CORS origin              |
| `PORT`           | `4000`                           | Backend server port              |
| `OPENAI_API_KEY` | —                                | OpenAI API key (required for AI) |
| `OPENAI_MODEL`   | `gpt-4o-mini`                    | OpenAI model name                |

---

## AI Features

Three GPT-powered agents are exposed under `/api/ai/*` (all JWT-protected):

| Agent           | Endpoint                         | Description                                                                                                                                        |
| --------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prioritizer** | `POST /ai/boards/:id/prioritize` | Scores every open card (priority weight + age + overdue penalty) and returns a ranked list with one-line reasoning per card                        |
| **Decomposer**  | `POST /ai/cards/:id/decompose`   | Checks a card for clarity, asks a clarifying question if needed, or breaks it into 2–5 concrete sub-tasks and optionally creates them on the board |
| **Standup**     | `POST /ai/boards/:id/standup`    | Reads done/in-progress/blocked cards and generates a Slack-style async standup message                                                             |
| **Card Chat**   | `POST /ai/cards/:id/chat`        | Contextual chat scoped to a single card; can execute `createSubtasks` or `setPriority` actions inline                                              |

> **D — Custom agent: Card-scoped AI Chat.** Engineers spend too much time context-switching between a ticket and external AI tools. Card Chat keeps the model fully aware of the card's title, description, assignees, priority, due date, and column — so responses are grounded in the actual task, not a generic prompt. More importantly, the model can _act_: typing "break this into subtasks" creates the subtasks directly on the board; "set priority to high" updates the card metadata — no copy-pasting required. This turns every card into a mini command-line for the AI, reducing the friction of translating AI output into board state.

### Using AI in the UI

- **Card modal** — open any card; the right-hand column is the AI chat panel. Use quick chips or type freely.
- **Board header** — click **AI Assist ▾** → _Prioritize day_ or _Generate standup_ to open side panels.

---

## Testing

The project uses **Vitest** with **React Testing Library** for unit and component tests.

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch
```

### Test files

| Test file                              | Cases | What's tested                                                                            |
| -------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `utils.test.ts` — `getInitials`        | 6     | null/undefined/empty input, single word, full name, 3-word truncation, uppercasing       |
| `utils.test.ts` — `formatRelativeTime` | 5     | "just now", minutes, hours, days, formatted date; uses `vi.useFakeTimers()`              |
| `filter-cards.test.ts`                 | 5     | No-op when no filters, search (case-insensitive), assignee filter, overdue, combined AND |
| `actions.test.ts`                      | 3     | Board-not-found error, API failure, successful label creation                            |
| `card-item.test.tsx`                   | 4     | Title renders, label color swatches, overdue CSS class, `onClick` fires; DnD mocked      |

---

## Project Structure

```
.
├── backend/                    # NestJS API
│   └── src/
│       ├── ai/                 # AI agents (NestJS module, service, controller)
│       ├── auth/               # JWT auth (register, login, logout)
│       ├── boards/             # Boards CRUD
│       ├── cards/              # Cards CRUD + assignees, labels, comments
│       ├── columns/            # Columns CRUD
│       ├── labels/             # Board-scoped labels
│       ├── realtime/           # Socket.IO gateway (board updates + presence)
│       ├── users/              # User profiles
│       └── workspaces/         # Workspaces + invite tokens
├── src/                        # Next.js frontend
│   ├── app/                    # App Router pages and layouts
│   ├── entities/               # Data-access layer (server actions + UI primitives)
│   │   ├── board/
│   │   ├── card/
│   │   ├── column/
│   │   └── workspace/
│   ├── features/               # User-facing feature modules
│   │   ├── ai/                 # AI agents: actions.ts + UI panels
│   │   ├── auth/
│   │   ├── card/
│   │   ├── column/
│   │   ├── presence/
│   │   └── realtime/
│   ├── shared/                 # Reusable utilities, types, UI components
│   │   ├── lib/
│   │   │   ├── api/            # Typed API client (fetch wrapper)
│   │   │   └── utils.ts
│   │   ├── types/              # Shared TypeScript types
│   │   └── ui/                 # shadcn/ui components
│   ├── widgets/                # Page-level compositions
│   │   ├── board-view/
│   │   └── sidebar/
│   └── middleware.ts           # JWT-based route protection
├── docker-compose.yml
└── Dockerfile
```

---

## Architecture Notes

### Feature-Sliced Design (FSD)

The frontend follows a simplified FSD structure: `shared → entities → features → widgets → app`. Data access lives in `entities`, user interactions in `features`, page compositions in `widgets`. This avoids circular dependencies and makes code easy to locate.

### Server Actions for mutations

All frontend writes go through Next.js Server Actions. The server action reads the JWT from the `httpOnly` cookie and forwards it to the NestJS backend via the `Cookie` header (since `credentials: 'include'` is browser-only and doesn't work in Node.js `fetch`).

### Real-time via Socket.IO

The NestJS `RealtimeGateway` manages a `/realtime` Socket.IO namespace. Clients emit `join-board` on mount and receive `board-update` events whenever any mutation occurs. Presence (who's viewing the board) is tracked server-side in a `Map<boardId, Map<socketId, user>>` and broadcast as `presence-update` events.

### JWT Auth

Auth is stateless — the backend issues a JWT on login which is stored as an `httpOnly` cookie by the Next.js server action. The Next.js middleware checks for this cookie to protect routes. The NestJS backend validates the JWT via `JwtAuthGuard` on every protected endpoint.

---

## Mock Data & Test Scenario

### Seeding the database

The repo ships a seed script that populates MongoDB with a realistic sprint — two users, one workspace, a board with 10 cards across 4 columns (different priorities, labels, assignees, 2 overdue cards), and activity history.

```bash
# via Docker Compose (recommended)
docker compose exec backend node seed.js

# or locally (MongoDB on localhost:27017)
cd backend && node seed.js
# equivalent shortcut
cd backend && npm run seed
```

The script is **idempotent** — re-running it prints a warning and exits without inserting duplicates. To reset, drop the `holymoly` database and run again.

**Credentials after seeding:**

| User                    | Password    | Role             |
| ----------------------- | ----------- | ---------------- |
| `alex.morgan@devlog.io` | `Demo1234!` | Workspace owner  |
| `sarah.chen@devlog.io`  | `Demo1234!` | Workspace member |

**Board state:**

| Column      | Cards | Notes                                                       |
| ----------- | ----- | ----------------------------------------------------------- |
| Backlog     | 3     | priorities: high / medium / low                             |
| In Progress | 3     | 2 cards are **overdue** (due yesterday), both high priority |
| Review / QA | 2     | medium + low                                                |
| Done        | 2     | closed items, no priority set                               |

---

### Test Scenario

#### Block 1 — Auth & Workspace

| #   | Action                                                                                                   | Expected result                                                       | Status |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| 1.1 | Go to [http://localhost:3000](http://localhost:3000) and log in as `alex.morgan@devlog.io` / `Demo1234!` | Redirected to `/workspaces`; tile **"Acme Dev Team"** is visible      | ✅     |
| 1.2 | Open the workspace                                                                                       | Left sidebar shows board **"DevLog — Sprint 1"**                      | ✅     |
| 1.3 | Open the board                                                                                           | 4 columns: Backlog (3) · In Progress (3) · Review / QA (2) · Done (2) | ✅     |

#### Block 2 — Priority badges & card detail

| #   | Action                                                                 | Expected result                                                                                                                       | Status |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Look at the **In Progress** column                                     | Cards **"Build AI task prioritization agent"** and **"Fix drag-and-drop on mobile Safari"** show a red dot (high) + **Overdue** badge | ✅     |
| 2.2 | Click **"Build AI task prioritization agent"**                         | 3-column modal: description · metadata sidebar · AI chat panel                                                                        | ✅     |
| 2.3 | In metadata sidebar, change priority to **Medium**                     | Dot changes red → yellow; card updates live via WebSocket                                                                             | ✅     |
| 2.4 | Revert priority to **High**                                            | Red dot returns                                                                                                                       | ✅     |
| 2.5 | Drag **"Implement card search & keyword filter"** into **Review / QA** | Card moves instantly; all positions update                                                                                            | ✅     |

#### Block 3 — Real-time collaboration

| #   | Action                                          | Expected result                                                       | Status |
| --- | ----------------------------------------------- | --------------------------------------------------------------------- | ------ |
| 3.1 | Open the same board in a **second browser tab** | Both tabs show Alex's avatar in the board header (presence indicator) | ✅     |
| 3.2 | In tab 1, drag any card to another column       | Tab 2 updates **without page reload**                                 | ✅     |
| 3.3 | In tab 1, add a comment to a card               | Tab 2 board refreshes (Socket.IO `board-update` fires)                | ✅     |

#### Block 4 — AI chat (inside card)

| #   | Action                                                         | Expected result                                                                                             | Status |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| 4.1 | Open **"Build AI task prioritization agent"**                  | Right panel shows 4 quick chips: _Generate subtasks · Suggest priority · Write standup update · Spot risks_ | ✅     |
| 4.2 | Click **"Generate subtasks"**                                  | AI returns 3–5 subtask titles saved as checklist inside the card                                            | ✅     |
| 4.3 | Check off a subtask                                            | Checkbox toggles; progress bar updates                                                                      | ✅     |
| 4.4 | Click **"Suggest priority"**                                   | AI recommends a priority with one-sentence reasoning based on card description                              | ✅     |
| 4.5 | Type `"What are the main risks of this task?"` and press Enter | Context-specific response mentioning overdue status, streaming complexity, error handling                   | ✅     |

#### Block 5 — AI Assist board-level panels

| #   | Action                                             | Expected result                                                                      | Status |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| 5.1 | Click **"AI Assist ▾"** in the board header        | Dropdown: **Prioritize day** and **Generate standup**                                | ✅     |
| 5.2 | **Prioritize day** → **Analyze board** button      | Ranked list appears; overdue high-priority cards occupy positions 1–2 with reasoning | ✅     |
| 5.3 | **Generate standup** → **Generate standup** button | Slack-style message: ✅ Done · 🔄 In Progress · 🚨 Blockers (2 overdue cards listed) | ✅     |
| 5.4 | **Copy to clipboard**                              | Message copied; paste into any editor to verify content                              | ✅     |

#### Block 6 — Comments & activity log

| #   | Action                                        | Expected result                                                                       | Status |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| 6.1 | Open **"Fix drag-and-drop on mobile Safari"** | Activity log shows Sarah's seeded comment: _"Reproduced on iPhone 13 (Safari 17.4)…"_ | ✅     |
| 6.2 | Type `"PR up for review"` and submit          | Comment appears at top of activity feed with Alex's name and timestamp                | ✅     |

#### Block 7 — Invite flow

| #   | Action                                                          | Expected result                                                            | Status |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| 7.1 | In workspace settings click **Invite member** and copy the link | URL of the form `/invite/[token]`                                          | ✅     |
| 7.2 | Open the link in an **incognito window**                        | Sign-in page with `?next=/invite/[token]`; after login auto-redirects back | ✅     |
| 7.3 | Register a new account                                          | Auto-added to **Acme Dev Team** as member; redirected to workspace         | ✅     |

---

## If I Had More Time

A list of deliberate shortcuts taken under time pressure and what a production-grade solution would look like.

| Area                         | What was shipped                                                                                                              | What I'd do with more time                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prioritize day — caching** | Result stored in `localStorage` with a 24-hour TTL (`prioritize_<boardId>`). Resets on page reload after expiry.              | Store the result in MongoDB alongside the board document (`lastPrioritization: { result, generatedAt }`). Expose a `GET /boards/:id/prioritization` endpoint. Add a background job (Bull/BullMQ) or a cron to auto-expire results older than 24 h server-side, ensuring all users and devices see a consistent, board-scoped snapshot regardless of client state. |
| **AI chat history**          | Full conversation embedded as an array inside the `Card` document. Grows unboundedly.                                         | Move chat to a dedicated `ChatThread` collection with pagination. Cap embedded history to the last N messages. Add indexes on `card_id + created_at` for efficient retrieval.                                                                                                                                                                                     |
| **Subtasks**                 | Embedded array on `Card`. No ordering, no assignee, no due date.                                                              | Promote subtasks to a lightweight standalone collection so they can be reordered, assigned, and have their own due dates and completion events in the activity log.                                                                                                                                                                                               |
| **AI prompt reliability**    | GPT responses are parsed with a `try/catch` fallback; no output schema validation.                                            | Use OpenAI's [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) (`response_format: { type: "json_schema", ... }`) to guarantee valid JSON every time. Add Zod validation on the parsed result.                                                                                                                                      |
| **Real-time AI actions**     | AI-applied changes (priority update, subtasks) trigger a full board `broadcastBoardUpdate` and the client reloads everything. | Emit granular WebSocket events (`card:priority_changed`, `card:subtasks_updated`) so only the affected card re-renders rather than the whole board.                                                                                                                                                                                                               |
