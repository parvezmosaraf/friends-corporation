import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shop } from '@/lib/types';

export function useShops() {
  return useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Shop[];
    },
  });
}

export function useShop(shopId: string) {
  return useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Shop | null;
    },
    enabled: !!shopId,
  });
}
