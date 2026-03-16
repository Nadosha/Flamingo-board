export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspaces_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      workspace_invites: {
        Row: {
          id: string;
          workspace_id: string;
          invited_by: string;
          token: string;
          email: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          invited_by: string;
          token?: string;
          email?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          invited_by?: string;
          token?: string;
          email?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_invites_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      boards: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          color: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          color?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'boards_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'boards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          name: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          name?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'columns_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
        ];
      };
      labels: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'labels_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      cards: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          description: string | null;
          position: number;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          title: string;
          description?: string | null;
          position: number;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          position?: number;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cards_column_id_fkey';
            columns: ['column_id'];
            isOneToOne: false;
            referencedRelation: 'columns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      card_assignees: {
        Row: {
          card_id: string;
          user_id: string;
        };
        Insert: {
          card_id: string;
          user_id: string;
        };
        Update: {
          card_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'card_assignees_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_assignees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      card_labels: {
        Row: {
          card_id: string;
          label_id: string;
        };
        Insert: {
          card_id: string;
          label_id: string;
        };
        Update: {
          card_id?: string;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'card_labels_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_labels_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'labels';
            referencedColumns: ['id'];
          },
        ];
      };
      card_activities: {
        Row: {
          id: string;
          card_id: string;
          user_id: string | null;
          type: string;
          content: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id?: string | null;
          type: string;
          content?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          user_id?: string | null;
          type?: string;
          content?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'card_activities_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'card_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      workspace_role: 'owner' | 'admin' | 'member';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
