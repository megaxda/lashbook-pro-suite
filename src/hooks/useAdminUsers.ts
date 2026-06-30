import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: { userId: id, updates },
      });
      if (error) {
        // Try to extract server error message
        const msg = (data as any)?.error || error.message || 'Erro ao atualizar';
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      if (!(data as any)?.user) throw new Error('Nenhuma linha atualizada');
      return (data as any).user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao atualizar'),
  });

  return { users, isLoading, updateUser };
}
