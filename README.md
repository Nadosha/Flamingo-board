# 🦩 Flamingo Board

A real-time collaborative Kanban board built with **Next.js 16**, **NestJS**, **MongoDB**, and **TypeScript**. Create workspaces, invite teammates, manage boards with drag-and-drop columns and cards, and see who's online — all in real time.

## Features

- **Workspaces** — organize boards by team or project, invite members via shareable links
- **Kanban boards** — columns and cards with drag-and-drop reordering
- **Card details** — descriptions (Markdown), labels, assignees, comments, due dates
- **Real-time collaboration** — live board updates and presence indicators via Socket.IO
- **Auth** — email/password registration and login with JWT session persistence
- **AI Agents** — GPT-powered prioritization, task decomposition, async standup generation, and in-card AI chat

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | Next.js 16.1.6 (App Router, Server Actions)       |
| Backend    | NestJS + MongoDB (Mongoose)                       |
| Realtime   | Socket.IO (WebSocket gateway)                     |
| Auth       | JWT (httpOnly cookie)                             |
| Styling    | Tailwind CSS + shadcn/ui                          |
| Language   | TypeScript                                        |
| Deployment | Docker Compose (mongo + backend + frontend)       |

---

## Requirements Coverage

| #                          | Requirement                                                      | Status                           |
| -------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| **Auth**                   |                                                                  |                                  |
| 1                          | Email/password registration and login                            | ✅ Done                          |
| 2                          | User profiles with avatars                                       | ✅ Done                          |
| 3                          | Invite-only workspaces via magic links                           | ✅ Done                          |
| **Database Schema**        |                                                                  |                                  |
| 4                          | Workspaces                                                       | ✅ Done                          |
| 5                          | Boards (belong to workspace)                                     | ✅ Done                          |
| 6                          | Columns (ordered within board)                                   | ✅ Done                          |
| 7                          | Cards (ordered within column, with assignees, labels, due dates) | ✅ Done                          |
| 8                          | Activity log per card                                            | ✅ Done                          |
| **Features**               |                                                                  |                                  |
| 9                          | Create/edit/delete boards and columns                            | ✅ Done                          |
| 10                         | Drag-and-drop cards between columns                              | ✅ Done                          |
| 11                         | Real-time sync across multiple browser tabs/users                | ✅ Done                          |
| 12                         | Presence indicators showing who's viewing the board              | ✅ Done                          |
| 13                         | Card detail modal with description and activity history          | ✅ Done                          |
| **Technical Requirements** |                                                                  |                                  |
| 14                         | Socket.IO WebSocket gateway for live updates                     | ✅ Done                          |
| 15                         | Optimistic drag-and-drop with conflict resolution                | ✅ Done                          |
| 16                         | @hello-pangea/dnd for drag interactions                          | ✅ Done                          |
| 17                         | TypeScript types shared across frontend and backend              | ✅ Done                          |
| **Bonus**                  |                                                                  |                                  |
| 18                         | Markdown editor in card detail                                   | ✅ Done                          |
| 19                         | Filter cards by assignee/label/due date                          | ✅ Done                          |

---

## Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js 20+](https://nodejs.org) (for local development only)

### Run with Docker (recommended)

```bash
git clone git@github.com:Nadosha/Flamingo-board.git
cd Flamingo-board
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

| Agent | Endpoint | Description |
|---|---|---|
| **Prioritizer** | `POST /ai/boards/:id/prioritize` | Scores every open card (priority weight + age + overdue penalty) and returns a ranked list with one-line reasoning per card |
| **Decomposer** | `POST /ai/cards/:id/decompose` | Checks a card for clarity, asks a clarifying question if needed, or breaks it into 2–5 concrete sub-tasks and optionally creates them on the board |
| **Standup** | `POST /ai/boards/:id/standup` | Reads done/in-progress/blocked cards and generates a Slack-style async standup message |
| **Card Chat** | `POST /ai/cards/:id/chat` | Contextual chat scoped to a single card; can execute `createSubtasks` or `setPriority` actions inline |

### Using AI in the UI

- **Card modal** — open any card; the right-hand column is the AI chat panel. Use quick chips or type freely.
- **Board header** — click **AI Assist ▾** → *Prioritize day* or *Generate standup* to open side panels.

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
