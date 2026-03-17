# 🦩 Flamingo Board

A real-time collaborative Kanban board built with Next.js 16, Supabase, and TypeScript. Create workspaces, invite teammates, manage boards with drag-and-drop columns and cards, and see who's online — all in real time.

## Features

- **Workspaces** — organize boards by team or project, invite members via shareable links
- **Kanban boards** — columns and cards with drag-and-drop reordering
- **Card details** — descriptions, labels, assignees, comments, due dates
- **Real-time collaboration** — live board updates and presence indicators via Supabase Realtime
- **Auth** — email/password registration and login with session persistence

## Requirements Coverage

| # | Requirement | Status |
|---|---|---|
| **Auth** | | |
| 1 | Email/password + Google OAuth | ✅ Done |
| 2 | User profiles with avatars | ✅ Done |
| 3 | Invite-only workspaces via magic links | ✅ Done |
| **Database Schema** | | |
| 4 | Workspaces | ✅ Done |
| 5 | Boards (belong to workspace) | ✅ Done |
| 6 | Columns (ordered within board) | ✅ Done |
| 7 | Cards (ordered within column, with assignees, labels, due dates) | ✅ Done |
| 8 | Activity log per card | ✅ Done |
| **Features** | | |
| 9 | Create/edit/delete boards and columns | ✅ Done |
| 10 | Drag-and-drop cards between columns | ✅ Done |
| 11 | Real-time sync across multiple browser tabs/users | ✅ Done |
| 12 | Presence indicators showing who's viewing the board | ✅ Done |
| 13 | Card detail modal with description and activity history | ✅ Done (description + comments) |
| **Technical Requirements** | | |
| 14 | Supabase Realtime subscriptions for live updates | ✅ Done |
| 15 | Optimistic drag-and-drop with conflict resolution | ✅ Done |
| 16 | @hello-pangea/dnd for drag interactions | ✅ Done |
| 17 | TypeScript types generated from the Supabase schema | ✅ Done |
| 18 | Row-Level Security for workspace isolation | ✅ Done |
| **Bonus** | | |
| 19 | Markdown editor in card detail | ✅ Done |
| 20 | Filter cards by assignee/label/due date | ✅ Done |
| 21 | Undo last action (local state) | ✅ Done |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Server Actions) |
| Database | Supabase (PostgreSQL + PostgREST + Realtime) |
| Auth | Supabase Auth (GoTrue) |
| Styling | Tailwind CSS + shadcn/ui |
| Language | TypeScript |
| Deployment | Docker (standalone Next.js output) |

---

## Setup

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`

### 1. Clone and install

```bash
git clone git@github.com:Nadosha/Flamingo-board.git
cd Flamingo-board
npm install
```

### 2. Start local Supabase

```bash
npx supabase start
```

This spins up the full Supabase stack locally (PostgreSQL, Auth, PostgREST, Realtime, Studio). After it starts, note the output — you'll need the keys for the next step.

Apply migrations (schema + RLS policies):

```bash
npx supabase db reset
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Public Supabase URL (used by browser and server)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Anon key from `npx supabase status`
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Service role key from `npx supabase status`
# Used server-side to bypass RLS after auth verification
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# App URL for invite links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4a. Run in development mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4b. Run with Docker

```bash
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Docker reads environment from `.env.local`. Make sure it exists before building.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase API URL (public, used in browser and server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase service role key — server-side only, never exposed to browser |
| `NEXT_PUBLIC_APP_URL` | yes | Base URL for generating invite links |
| `SUPABASE_INTERNAL_URL` | auto | Set in Docker to reach Supabase from inside the container (`http://host.docker.internal:54321`) |

---

## Testing

The project uses **Vitest** with **React Testing Library** for unit and component tests.

### Running tests

```bash
# Run all tests once
npm test

# Watch mode — re-runs on file change
npm run test:watch
```

### Test files location

Tests live alongside the code they test (`*.test.ts` / `*.test.tsx`):

```
src/
  shared/lib/
    utils.test.ts               # getInitials, formatRelativeTime
  features/card/
    lib/filter-cards.test.ts    # filterCards business logic
    ui/card-item.test.tsx       # CardItem component
  entities/card/
    actions.test.ts             # createLabelAction server action
  test/
    setup.ts                    # global test setup (@testing-library/jest-dom)

vitest.config.ts                # Vitest configuration (jsdom env + path aliases)
```

### What's covered

| Test file | Cases | What's tested |
|---|---|---|
| `utils.test.ts` — `getInitials` | 6 | null/undefined/empty input, single word, full name, 3-word truncation, uppercasing |
| `utils.test.ts` — `formatRelativeTime` | 5 | "just now", minutes, hours, days, formatted date; uses `vi.useFakeTimers()` |
| `filter-cards.test.ts` | 5 | No-op when no filters, search (case-insensitive), assignee filter, overdue filter, combined AND logic |
| `actions.test.ts` | 3 | Board-not-found error, Supabase insert failure, successful label creation; Supabase mocked with `vi.mock()` |
| `card-item.test.tsx` | 4 | Title renders, label color swatches, overdue CSS class, `onClick` fires; DnD mocked as passthrough |

### Stack

| Tool | Role |
|---|---|
| [Vitest](https://vitest.dev) | Test runner + assertion library |
| [@testing-library/react](https://testing-library.com/react) | Component rendering & queries |
| [@testing-library/user-event](https://testing-library.com/user-event) | Simulates real user interactions |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | DOM matchers (`toBeInTheDocument`, etc.) |
| jsdom | Simulated browser DOM for Node.js |

---

## Project Structure

The project follows Feature-Sliced Design (FSD) architecture:

```
src/
├── app
│   ├── auth
│   │   ├── callback
│   │   └── signout
│   ├── favicon.ico
│   ├── globals.css
│   ├── invite
│   │   └── [token]
│   ├── layout.tsx
│   ├── login
│   │   └── page.tsx
│   ├── page.module.css
│   ├── page.tsx
│   ├── register
│   │   └── page.tsx
│   └── workspaces
│       ├── [workspaceId]
│       ├── layout.tsx
│       └── page.tsx
├── entities
│   ├── board
│   │   ├── actions.ts
│   │   └── ui
│   ├── card
│   │   ├── actions.test.ts
│   │   └── actions.ts
│   ├── column
│   │   └── actions.ts
│   └── workspace
│       ├── actions.ts
│       └── ui
├── features
│   ├── auth
│   │   ├── actions.ts
│   │   └── ui
│   ├── card
│   │   ├── lib
│   │   └── ui
│   ├── column
│   │   └── ui
│   ├── presence
│   │   └── ui
│   └── realtime
│       └── hooks
├── middleware.ts
├── shared
│   ├── hooks
│   │   └── use-toast.ts
│   ├── lib
│   │   ├── supabase
│   │   ├── utils.test.ts
│   │   └── utils.ts
│   ├── types
│   │   ├── database.ts
│   │   └── index.ts
│   └── ui
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── textarea.tsx
│       ├── theme-provider.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── tooltip.tsx
├── test
│   └── setup.ts
└── widgets
    ├── board-view
    │   └── ui
    └── sidebar
        └── ui
```

---

### Feature-Sliced Design (FSD)
The codebase follows a simplified FSD structure: `shared → entities → features → widgets → app`. This keeps concerns separated — data access in `entities`, user interactions in `features`, compositions in `widgets`. Makes things easy to locate and avoids circular dependencies.

### Server Actions for all mutations
All writes go through Next.js Server Actions rather than API routes. This avoids building a separate REST/GraphQL layer, keeps the server-client boundary explicit, and provides automatic CSRF protection. The tradeoff is that optimistic UI requires more manual wiring compared to a client-side mutation library like React Query.

### Service role key for server-side DB operations
Local Supabase CLI v2 signs user JWTs with ES256 (EC key), but PostgREST 14 silently fails ES256 verification and falls back to the `anon` role — causing every RLS-protected write to fail. The fix: server actions use `createAdminClient()` with the `sb_secret_*` service role key. Kong's API gateway intercepts this and injects a valid HS256 service_role JWT that PostgREST accepts. Auth is still verified via the regular `createClient()` before any DB write, so user identity is always confirmed first.

### Row-Level Security (RLS)
All tables have RLS enabled. Helper functions `is_workspace_member()` and `is_workspace_admin()` are `SECURITY DEFINER` to prevent infinite recursion when policies on `workspace_members` query themselves. The `card_assignees.user_id` FK references `public.profiles` (not `auth.users`) so PostgREST can resolve the JOIN within the public schema.

### Realtime via Supabase channels
Board updates subscribe to `postgres_changes` filtered by `board_id`. Presence (online indicators) uses Supabase Presence channels. Both are encapsulated in custom hooks (`use-realtime-board`, `use-presence`) mounted at the board view level.

### Optimistic drag-and-drop with conflict resolution
`onDragEnd` is synchronous — the board state is updated **immediately** on drop without waiting for the server. The server call fires in the background via `.then().catch()`.

Conflict resolution is handled with two mechanisms:

1. **Auto-revert on failure** — a `savedBoard` snapshot is taken before each drag. If the server action rejects (network error, RLS violation, etc.), the board is rolled back to `savedBoard` automatically. The undo stack entry for that drag is also removed.

2. **Realtime suppression during in-flight ops** — `pendingOpsRef` tracks the number of in-flight drag operations. The `useRealtimeBoard` callback ignores incoming Supabase `postgres_changes` events while `pendingOpsRef > 0`, preventing a server-triggered refetch from overwriting the optimistic state mid-flight. Once all pending ops settle, the next realtime event re-syncs the board normally — picking up any concurrent changes made by other users.

---

## What I'd Improve With More Time

**Product**
- File attachments on cards via Supabase Storage
- Board backgrounds — custom image or color
- Activity log per card
- Notifications for @mentions and assignments

**Technical**
- Fix the ES256/PostgREST root cause by configuring Supabase to sign with HS256 (`jwt_secret` in `config.toml`) instead of the service role key workaround
- E2E tests with Playwright covering auth, workspace creation, and card drag-and-drop
- Proper error boundaries with user-facing messages instead of exceptions bubbling to the Next.js error page
- Pagination or virtual scrolling for large boards
- CI/CD pipeline (GitHub Actions) with lint, type-check, and tests on every PR
- Move to a managed Supabase project for production with proper secrets management
