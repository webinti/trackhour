export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "free" | "premium" | "business";
export type MemberRole = "owner" | "admin" | "member";
export type MemberStatus = "pending" | "active";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: Plan;
          plan_status: string | null;
          plan_period_end: string | null;
          company_name: string | null;
          company_address: string | null;
          company_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Plan;
          plan_status?: string | null;
          plan_period_end?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          company_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: Plan;
          plan_status?: string | null;
          plan_period_end?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          company_email?: string | null;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string | null;
          invited_email: string;
          role: MemberRole;
          status: MemberStatus;
          invitation_token: string | null;
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id?: string | null;
          invited_email: string;
          role?: MemberRole;
          status?: MemberStatus;
          invitation_token?: string | null;
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          role?: MemberRole;
          status?: MemberStatus;
          invitation_token?: string | null;
          joined_at?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          color: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          color?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string | null;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          team_id: string;
          name: string;
          color: string;
          is_private: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          team_id: string;
          name: string;
          color?: string;
          is_private?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          is_private?: boolean;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          hourly_rate: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          hourly_rate?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          hourly_rate?: number | null;
          updated_at?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          task_id: string | null;
          project_id: string | null;
          user_id: string;
          description: string | null;
          hourly_rate: number | null;
          started_at: string;
          ended_at: string | null;
          paused_at: string | null;
          paused_duration: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          project_id?: string | null;
          user_id: string;
          description?: string | null;
          hourly_rate?: number | null;
          started_at: string;
          ended_at?: string | null;
          paused_at?: string | null;
          paused_duration?: number;
          created_at?: string;
        };
        Update: {
          task_id?: string | null;
          project_id?: string | null;
          description?: string | null;
          hourly_rate?: number | null;
          started_at?: string;
          ended_at?: string | null;
          paused_at?: string | null;
          paused_duration?: number;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
