import type { Database } from './database';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// Entity types
export type Profile = Tables<'profiles'>;
export type Workspace = Tables<'workspaces'>;
export type WorkspaceMember = Tables<'workspace_members'>;
export type WorkspaceInvite = Tables<'workspace_invites'>;
export type Board = Tables<'boards'>;
export type Column = Tables<'columns'>;
export type Card = Tables<'cards'>;
export type Label = Tables<'labels'>;
export type CardAssignee = Tables<'card_assignees'>;
export type CardLabel = Tables<'card_labels'>;
export type CardActivity = Tables<'card_activities'>;

// Enriched types
export type CardWithRelations = Card & {
  assignees: Array<{ user_id: string; profile: Profile | null }>;
  labels: Array<{ label_id: string; label: Label }>;
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
  | 'card_created'
  | 'card_updated'
  | 'card_moved'
  | 'card_commented'
  | 'assignee_added'
  | 'assignee_removed'
  | 'label_added'
  | 'label_removed'
  | 'due_date_set'
  | 'due_date_removed';
