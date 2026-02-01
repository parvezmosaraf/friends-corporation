import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalaryRecord, PayrollSummary, calculateSalary } from '@/lib/types';
import { toast } from 'sonner';

export function useSalaryRecords(shopId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: ['salary_records', shopId, month, year],
    queryFn: async () => {
      let query = supabase
        .from('salary_records')
        .select('*, employee:employees(*, shop:shops(*))');
      
      if (month) {
        query = query.eq('month', month);
      }
      if (year) {
        query = query.eq('year', year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by shop if provided
      let records = data as SalaryRecord[];
      if (shopId) {
        records = records.filter(r => r.employee?.shop_id === shopId);
      }
      
      return records;
    },
  });
}

export function usePayrollSummary(month?: number, year?: number) {
  return useQuery({
    queryKey: ['payroll_summary', month, year],
    queryFn: async () => {
      let query = supabase
        .from('salary_records')
        .select('total_calculated, status');
      
      if (month) {
        query = query.eq('month', month);
      }
      if (year) {
        query = query.eq('year', year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const summary: PayrollSummary = {
        totalPayroll: 0,
        totalPaid: 0,
        totalPending: 0,
      };
      
      (data || []).forEach((record) => {
        summary.totalPayroll += Number(record.total_calculated);
        if (record.status === 'Paid') {
          summary.totalPaid += Number(record.total_calculated);
        } else {
          summary.totalPending += Number(record.total_calculated);
        }
      });
      
      return summary;
    },
  });
}

export function useShopPayrollSummary(shopId: string, month?: number, year?: number) {
  return useQuery({
    queryKey: ['shop_payroll_summary', shopId, month, year],
    queryFn: async () => {
      let query = supabase
        .from('salary_records')
        .select('total_calculated, status, employee:employees!inner(shop_id)');
      
      if (month) {
        query = query.eq('month', month);
      }
      if (year) {
        query = query.eq('year', year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const summary: PayrollSummary = {
        totalPayroll: 0,
        totalPaid: 0,
        totalPending: 0,
      };
      
      (data || []).filter((r: any) => r.employee?.shop_id === shopId).forEach((record: any) => {
        summary.totalPayroll += Number(record.total_calculated);
        if (record.status === 'Paid') {
          summary.totalPaid += Number(record.total_calculated);
        } else {
          summary.totalPending += Number(record.total_calculated);
        }
      });
      
      return summary;
    },
    enabled: !!shopId,
  });
}

export function useCreateSalaryRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (record: Omit<SalaryRecord, 'id' | 'created_at' | 'updated_at' | 'employee'>) => {
      const { data, error } = await supabase
        .from('salary_records')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_records'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_summary'] });
      queryClient.invalidateQueries({ queryKey: ['shop_payroll_summary'] });
      toast.success('Salary record created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create salary record: ${error.message}`);
    },
  });
}

export function useUpdateSalaryRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalaryRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('salary_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_records'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_summary'] });
      queryClient.invalidateQueries({ queryKey: ['shop_payroll_summary'] });
      toast.success('Salary record updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update salary record: ${error.message}`);
    },
  });
}

export function useUpsertSalaryRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (record: Omit<SalaryRecord, 'id' | 'created_at' | 'updated_at' | 'employee'>) => {
      const { data, error } = await supabase
        .from('salary_records')
        .upsert(record, { onConflict: 'employee_id,month,year' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_records'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_summary'] });
      queryClient.invalidateQueries({ queryKey: ['shop_payroll_summary'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save salary record: ${error.message}`);
    },
  });
}

export function useGenerateSalaryRecords() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ shopId, month, year }: { shopId: string; month: number; year: number }) => {
      // Get all employees for this shop
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', shopId);
      
      if (empError) throw empError;
      
      // Get days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Create records for each employee
      const records = employees.map(emp => ({
        employee_id: emp.id,
        month,
        year,
        attendance_days: daysInMonth,
        leave_unpaid: 0,
        paid_leave: 0,
        advance_taken: 0,
        bonus: 0,
        penalty: 0,
        increment_adjustment: 0,
        days_in_month: daysInMonth,
        total_calculated: Number(emp.base_salary),
        status: 'Pending' as const,
      }));
      
      const { error } = await supabase
        .from('salary_records')
        .upsert(records, { onConflict: 'employee_id,month,year' });
      
      if (error) throw error;
      
      return records.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['salary_records'] });
      queryClient.invalidateQueries({ queryKey: ['payroll_summary'] });
      queryClient.invalidateQueries({ queryKey: ['shop_payroll_summary'] });
      toast.success(`Generated salary records for ${count} employees`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate records: ${error.message}`);
    },
  });
}
