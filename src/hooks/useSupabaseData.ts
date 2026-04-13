import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Client, Appointment, Product, Service, Transaction } from '@/data/mockData';

// Hook genérico para queries
const useSupabaseQuery = <T,>(table: string, orderBy?: { column: string; ascending?: boolean }) => {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      let query = supabase.from(table).select('*');
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
  });
};

// Hook genérico para mutations
const useSupabaseMutation = (table: string, successMessage: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const add = useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from(table).insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast({ title: successMessage });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [table] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [table] }),
  });

  return { add, update, remove };
};

// CLIENTES
export const useClientes = () => {
  const { data, isLoading } = useSupabaseQuery<Client>('clientes', { column: 'created_at', ascending: false });
  const { add, update, remove } = useSupabaseMutation('clientes', 'Cliente salvo!');
  return { clientes: data || [], isLoading, addCliente: add, updateCliente: update, deleteCliente: remove };
};

// AGENDAMENTOS
export const useAgendamentos = () => {
  const { data, isLoading } = useSupabaseQuery<Appointment>('agendamentos', { column: 'data', ascending: true });
  const { add, update, remove } = useSupabaseMutation('agendamentos', 'Agendamento salvo!');
  return { agendamentos: data || [], isLoading, addAgendamento: add, updateAgendamento: update, deleteAgendamento: remove };
};

// SERVIÇOS
export const useServicos = () => {
  const { data, isLoading } = useSupabaseQuery<Service>('servicos', { column: 'nome' });
  const { add, update, remove } = useSupabaseMutation('servicos', 'Serviço salvo!');
  return { servicos: data || [], isLoading, addServico: add, updateServico: update, deleteServico: remove };
};

// ESTOQUE
export const useEstoque = () => {
  const { data, isLoading } = useSupabaseQuery<Product>('estoque', { column: 'nome' });
  const { add, update, remove } = useSupabaseMutation('estoque', 'Produto salvo!');
  return { estoque: data || [], isLoading, addProduto: add, updateProduto: update, deleteProduto: remove };
};

// FINANCEIRO
export const useFinanceiro = () => {
  const { data, isLoading } = useSupabaseQuery<Transaction>('financeiro', { column: 'data', ascending: false });
  const { add, update, remove } = useSupabaseMutation('financeiro', 'Transação salva!');
  return { transacoes: data || [], isLoading, addTransacao: add, updateTransacao: update, deleteTransacao: remove };
};
