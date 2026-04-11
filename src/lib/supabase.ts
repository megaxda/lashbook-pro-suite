import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kgtzyjaspgvwfsdmrilx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndHp5amFzcGd2d2ZzZG1yaWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDI3NzgsImV4cCI6MjA4NTE3ODc3OH0.5nRl1OeWEwPYPloQ1BZuzgMSxYyJxQ_lL2OVOedr3gA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: { Row: any; Insert: any; Update: any };
      clientes: { Row: any; Insert: any; Update: any };
      servicos: { Row: any; Insert: any; Update: any };
      agendamentos: { Row: any; Insert: any; Update: any };
      financeiro: { Row: any; Insert: any; Update: any };
      estoque: { Row: any; Insert: any; Update: any };
      fichas_tecnicas: { Row: any; Insert: any; Update: any };
      followup: { Row: any; Insert: any; Update: any };
    };
  };
};
