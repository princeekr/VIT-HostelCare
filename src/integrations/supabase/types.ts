export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      complaints: {
        Row: {
          admin_notes: string | null
          assigned_staff: Database["public"]["Enums"]["staff_type"] | null
          assigned_worker_id: string | null
          block: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          created_at: string
          description: string
          floor: string | null
          hostel_name: string | null
          id: string
          photo_url: string | null
          priority: Database["public"]["Enums"]["complaint_priority"]
          room_number: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_staff?: Database["public"]["Enums"]["staff_type"] | null
          assigned_worker_id?: string | null
          block?: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          created_at?: string
          description: string
          floor?: string | null
          hostel_name?: string | null
          id?: string
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["complaint_priority"]
          room_number?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_staff?: Database["public"]["Enums"]["staff_type"] | null
          assigned_worker_id?: string | null
          block?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          created_at?: string
          description?: string
          floor?: string | null
          hostel_name?: string | null
          id?: string
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["complaint_priority"]
          room_number?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          block: string | null
          created_at: string
          floor: string | null
          full_name: string
          hostel_name: string | null
          id: string
          room_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block?: string | null
          created_at?: string
          floor?: string | null
          full_name: string
          hostel_name?: string | null
          id?: string
          room_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block?: string | null
          created_at?: string
          floor?: string | null
          full_name?: string
          hostel_name?: string | null
          id?: string
          room_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          phone: string | null
          updated_at: string
          user_id: string
          worker_type: Database["public"]["Enums"]["staff_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          worker_type: Database["public"]["Enums"]["staff_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          worker_type?: Database["public"]["Enums"]["staff_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_worker_record: {
        Args: {
          _phone?: string
          _user_id: string
          _worker_type: Database["public"]["Enums"]["staff_type"]
        }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "student" | "admin" | "worker"
      complaint_category:
        | "electricity"
        | "water"
        | "cleaning"
        | "wifi"
        | "plumbing"
        | "furniture"
        | "other"
      complaint_priority: "low" | "medium" | "high"
      complaint_status:
        | "pending"
        | "in_progress"
        | "resolved"
        | "waiting_confirmation"
      staff_type:
        | "electrician"
        | "plumber"
        | "cleaner"
        | "technician"
        | "maintenance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "admin", "worker"],
      complaint_category: [
        "electricity",
        "water",
        "cleaning",
        "wifi",
        "plumbing",
        "furniture",
        "other",
      ],
      complaint_priority: ["low", "medium", "high"],
      complaint_status: [
        "pending",
        "in_progress",
        "resolved",
        "waiting_confirmation",
      ],
      staff_type: [
        "electrician",
        "plumber",
        "cleaner",
        "technician",
        "maintenance",
      ],
    },
  },
} as const
