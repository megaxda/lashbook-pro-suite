import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient compartilhado com defaults conscientes para reduzir
 * refetches desnecessários e dar sensação de carregamento instantâneo.
 *
 * - staleTime: dados ficam "frescos" por 1 minuto. Durante esse tempo,
 *   navegar entre abas não dispara nova requisição.
 * - gcTime: cache permanece em memória por 5 min após o último uso.
 * - refetchOnWindowFocus: desligado — evita refetch ao voltar para a aba.
 * - refetchOnMount: false — se houver dado em cache não-stale, usa direto.
 * - retry: 1 tentativa extra; falhas transitórias raramente exigem mais.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Chaves estáveis para o cache. Use sempre estas funções para evitar typos. */
export const queryKeys = {
  clientes: (userId: string) => ["clientes", userId] as const,
  servicos: (userId: string, onlyAtivos = false) =>
    ["servicos", userId, { onlyAtivos }] as const,
  estoque: (userId: string) => ["estoque", userId] as const,
  profissionais: (userId: string) => ["profissionais", userId] as const,
  agendamentos: (userId: string, range?: { start?: string; end?: string }) =>
    ["agendamentos", userId, range ?? {}] as const,
  bloqueios: (userId: string) => ["bloqueios", userId] as const,
  financeiro: (userId: string, range?: { start?: string; end?: string }) =>
    ["financeiro", userId, range ?? {}] as const,
  fichas: (userId: string) => ["fichas", userId] as const,
  followUps: (userId: string) => ["followUps", userId] as const,
};
