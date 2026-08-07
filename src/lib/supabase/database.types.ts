export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          dietary: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          dietary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          dietary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      taste_dna: {
        Row: {
          user_id: string;
          profile: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          profile?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          profile?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          user_id: string;
          food_ids: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          food_ids?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          food_ids?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendation_history: {
        Row: {
          id: string;
          user_id: string;
          food_id: string;
          intent: string;
          rating: string | null;
          answers: Json | null;
          place: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          food_id: string;
          intent: string;
          rating?: string | null;
          answers?: Json | null;
          place?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          food_id?: string;
          intent?: string;
          rating?: string | null;
          answers?: Json | null;
          place?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      gamification: {
        Row: {
          user_id: string;
          state: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          state?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          state?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      email_for_username: {
        Args: { lookup_username: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
