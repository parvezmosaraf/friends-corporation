import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/lib/types';
import { toast } from 'sonner';

export function useEmployees(shopId?: string) {
  return useQuery({
    queryKey: ['employees', shopId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*, shop:shops(*)');
      
      if (shopId) {
        query = query.eq('shop_id', shopId);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, shop:shops(*)')
        .eq('id', employeeId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Employee | null;
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'shop'>) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add employee: ${error.message}`);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete employee: ${error.message}`);
    },
  });
}
