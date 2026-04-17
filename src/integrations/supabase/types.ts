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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_id: string | null
          comprovante_url: string | null
          created_at: string
          data: string
          forma_pagamento: string | null
          horario: string
          id: string
          notas: string | null
          origem: string | null
          servico_id: string | null
          sinal_pago: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data: string
          forma_pagamento?: string | null
          horario: string
          id?: string
          notas?: string | null
          origem?: string | null
          servico_id?: string | null
          sinal_pago?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          horario?: string
          id?: string
          notas?: string | null
          origem?: string | null
          servico_id?: string | null
          sinal_pago?: boolean | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          birthday: string | null
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          nome: string
          notas: string | null
          status: string | null
          telefone: string | null
          user_id: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          notas?: string | null
          status?: string | null
          telefone?: string | null
          user_id: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          notas?: string | null
          status?: string | null
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      estoque: {
        Row: {
          created_at: string
          fornecedor: string | null
          id: string
          marca: string | null
          nome: string
          preco_custo: number | null
          quantidade: number | null
          quantidade_minima: number | null
          unidade: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fornecedor?: string | null
          id?: string
          marca?: string | null
          nome: string
          preco_custo?: number | null
          quantidade?: number | null
          quantidade_minima?: number | null
          unidade?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fornecedor?: string | null
          id?: string
          marca?: string | null
          nome?: string
          preco_custo?: number | null
          quantidade?: number | null
          quantidade_minima?: number | null
          unidade?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fichas: {
        Row: {
          anexos_urls: Json | null
          cliente_id: string | null
          consent_signed_at: string | null
          consentimentos: Json | null
          created_at: string
          dados_cliente: Json | null
          fotos_urls: Json | null
          historico: string | null
          id: string
          observacoes: string | null
          procedimentos: Json | null
          restricoes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anexos_urls?: Json | null
          cliente_id?: string | null
          consent_signed_at?: string | null
          consentimentos?: Json | null
          created_at?: string
          dados_cliente?: Json | null
          fotos_urls?: Json | null
          historico?: string | null
          id?: string
          observacoes?: string | null
          procedimentos?: Json | null
          restricoes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anexos_urls?: Json | null
          cliente_id?: string | null
          consent_signed_at?: string | null
          consentimentos?: Json | null
          created_at?: string
          dados_cliente?: Json | null
          fotos_urls?: Json | null
          historico?: string | null
          id?: string
          observacoes?: string | null
          procedimentos?: Json | null
          restricoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          agendamento_id: string | null
          categoria: string | null
          created_at: string
          data: string
          descricao: string | null
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo: string
          user_id: string
          valor?: number
        }
        Update: {
          agendamento_id?: string | null
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          cliente_id: string | null
          created_at: string
          dias_sem_retorno: number | null
          id: string
          status: string | null
          ultimo_agendamento: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          dias_sem_retorno?: number | null
          id?: string
          status?: string | null
          ultimo_agendamento?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          dias_sem_retorno?: number | null
          id?: string
          status?: string | null
          ultimo_agendamento?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          cobrar_sinal: boolean | null
          created_at: string
          email: string | null
          follow_up_days: number | null
          foto_url: string | null
          id: string
          instagram: string | null
          nome: string | null
          outros_links: Json | null
          pix_key: string | null
          pix_key_type: string | null
          role: string
          site: string | null
          slug: string | null
          studio_hours: Json | null
          studio_name: string | null
          telefone: string | null
          valor_sinal: number | null
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          cobrar_sinal?: boolean | null
          created_at?: string
          email?: string | null
          follow_up_days?: number | null
          foto_url?: string | null
          id: string
          instagram?: string | null
          nome?: string | null
          outros_links?: Json | null
          pix_key?: string | null
          pix_key_type?: string | null
          role?: string
          site?: string | null
          slug?: string | null
          studio_hours?: Json | null
          studio_name?: string | null
          telefone?: string | null
          valor_sinal?: number | null
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          cobrar_sinal?: boolean | null
          created_at?: string
          email?: string | null
          follow_up_days?: number | null
          foto_url?: string | null
          id?: string
          instagram?: string | null
          nome?: string | null
          outros_links?: Json | null
          pix_key?: string | null
          pix_key_type?: string | null
          role?: string
          site?: string | null
          slug?: string | null
          studio_hours?: Json | null
          studio_name?: string | null
          telefone?: string | null
          valor_sinal?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          duracao: number | null
          id: string
          nome: string
          preco: number | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          duracao?: number | null
          id?: string
          nome: string
          preco?: number | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          duracao?: number | null
          id?: string
          nome?: string
          preco?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_public_booking: {
        Args: {
          _comprovante_url: string
          _data: string
          _email: string
          _horario: string
          _nome: string
          _notas: string
          _servico_id: string
          _slug: string
          _telefone: string
        }
        Returns: string
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      get_public_profile_by_slug: {
        Args: { _slug: string }
        Returns: {
          bio: string
          cobrar_sinal: boolean
          foto_url: string
          id: string
          instagram: string
          nome: string
          outros_links: Json
          pix_key: string
          pix_key_type: string
          site: string
          slug: string
          studio_hours: Json
          studio_name: string
          valor_sinal: number
          whatsapp: string
        }[]
      }
      get_public_services_by_slug: {
        Args: { _slug: string }
        Returns: {
          descricao: string
          duracao: number
          id: string
          nome: string
          preco: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
