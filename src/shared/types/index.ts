// Entity types (matching NestJS/MongoDB backend responses)

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  created_at: string;
}

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
}

export interface Subtask {
  title: string;
  done: boolean;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  priority: "low" | "medium" | "high" | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface CardActivity {
  id: string;
  card_id: string;
  user_id: string;
  type: ActivityType;
  content: string;
  created_at: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
}

// Enriched types
export type CardWithRelations = Card & {
  assignees: Array<{ user_id: string; profile: Profile | null }>;
  labels: Array<{ label_id: string; label: Label }>;
  card_activities?: CardActivity[];
};

export type ColumnWithCards = Column & {
  cards: CardWithRelations[];
};

export type BoardWithColumns = Board & {
  columns: ColumnWithCards[];
};

export type WorkspaceWithMembers = Workspace & {
  workspace_members: Array<WorkspaceMember & { profile: Profile | null }>;
};

// Presence
export interface PresenceUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  online_at: string;
  cursor?: { x: number; y: number };
}

// Activity types
export type ActivityType =
  | "card_created"
  | "card_updated"
  | "card_moved"
  | "card_commented"
  | "assignee_added"
  | "assignee_removed"
  | "label_added"
  | "label_removed"
  | "due_date_set"
  | "due_date_removed";
