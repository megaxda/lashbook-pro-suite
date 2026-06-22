/**
 * Hooks de leitura compartilhados, baseados em React Query.
 *
 * Por que centralizar:
 *  - Múltiplas telas (Dashboard, Agendamentos, Clientes, modais) consomem
 *    os mesmos dados. Usando a MESMA queryKey, o React Query devolve o
 *    cache em memória sem ir ao banco.
 *  - `enabled: !!user` evita disparo antes do login.
 *  - Em modo demo, devolvemos dados estáticos sem rede.
 *
 * Para invalidar após mutação use `useInvalidate` (mais abaixo).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/queryClient";
import {
  demoClientes,
  demoServicos,
  demoEstoque,
  demoAgendamentos,
  demoFinanceiro,
} from "@/data/demoData";

const enabled = (user: { id: string } | null) => !!user;

export function useClientes() {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.clientes(user?.id ?? "anon"),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) return demoClientes as any[];
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user!.id)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useServicos(onlyAtivos = false) {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.servicos(user?.id ?? "anon", onlyAtivos),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) {
        const list = demoServicos as any[];
        return onlyAtivos ? list.filter((s) => s.ativo) : list;
      }
      let q = supabase
        .from("servicos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (onlyAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEstoque() {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.estoque(user?.id ?? "anon"),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) return demoEstoque as any[];
      const { data, error } = await supabase
        .from("estoque")
        .select("*")
        .eq("user_id", user!.id)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfissionais() {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.profissionais(user?.id ?? "anon"),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) return [];
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .eq("user_id", user!.id)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AgendamentoRow {
  id: string;
  data: string;
  horario: string | null;
  status: string | null;
  gratuito: boolean | null;
  forma_pagamento: string | null;
  cliente_id: string;
  notas?: string | null;
  comprovante_url?: string | null;
  sinal_pago?: boolean | null;
  origem?: string | null;
  profissional_id?: string | null;
  pagamentos_detalhe?: any;
  clientes?: { nome: string } | null;
  servicos?: { nome: string; preco: number | null; duracao: number | null } | null;
}

export function useAgendamentos(range?: { start?: string; end?: string }) {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.agendamentos(user?.id ?? "anon", range),
    enabled: enabled(user),
    queryFn: async (): Promise<AgendamentoRow[]> => {
      if (isDemo) return demoAgendamentos as any;
      let q = supabase
        .from("agendamentos")
        .select(
          "id, data, horario, status, gratuito, forma_pagamento, cliente_id, notas, comprovante_url, sinal_pago, origem, profissional_id, pagamentos_detalhe, clientes(nome), servicos(nome, preco, duracao)"
        )
        .eq("user_id", user!.id)
        .order("data")
        .order("horario");
      if (range?.start) q = q.gte("data", range.start);
      if (range?.end) q = q.lte("data", range.end);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useBloqueios() {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.bloqueios(user?.id ?? "anon"),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) return [];
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .select("id, data, dia_todo, hora_inicio, hora_fim, motivo, user_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFinanceiro(range?: { start?: string; end?: string }) {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.financeiro(user?.id ?? "anon", range),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) {
        let list = demoFinanceiro as any[];
        if (range?.start) list = list.filter((t) => t.data >= range.start!);
        if (range?.end) list = list.filter((t) => t.data <= range.end!);
        return list;
      }
      let q = supabase
        .from("financeiro")
        .select("*")
        .eq("user_id", user!.id)
        .order("data", { ascending: false });
      if (range?.start) q = q.gte("data", range.start);
      if (range?.end) q = q.lte("data", range.end);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFichas() {
  const { user, isDemo } = useAuth();
  return useQuery({
    queryKey: queryKeys.fichas(user?.id ?? "anon"),
    enabled: enabled(user),
    queryFn: async () => {
      if (isDemo) return [];
      const { data, error } = await supabase
        .from("fichas")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Invalida caches afetados por uma mutação. Use SEMPRE após criar/editar/
 * excluir, passando só as chaves realmente impactadas. Não use
 * invalidateQueries() sem chave — invalida tudo e mata o ganho de cache.
 */
export function useInvalidate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id ?? "anon";

  return useCallback(
    (
      keys: Array<
        | "clientes"
        | "servicos"
        | "estoque"
        | "profissionais"
        | "agendamentos"
        | "bloqueios"
        | "financeiro"
        | "fichas"
        | "followUps"
      >
    ) => {
      keys.forEach((k) => {
        qc.invalidateQueries({ queryKey: [k, uid] });
      });
    },
    [qc, uid]
  );
}
