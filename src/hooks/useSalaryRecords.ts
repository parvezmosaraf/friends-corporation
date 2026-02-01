import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalaryRecord, PayrollSummary, calculateSalary, ATTENDANCE_DAYS_PER_MONTH } from '@/lib/types';
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
      
      // Filter by shop if provided (employee may be object or array from join)
      let records = (data || []) as SalaryRecord[];
      if (shopId) {
        records = records.filter(r => {
          const emp = r.employee;
          const shopIdFromEmp = Array.isArray(emp) ? emp[0]?.shop_id : (emp as { shop_id?: string })?.shop_id;
          return shopIdFromEmp === shopId;
        });
      }
      // Normalize: ensure employee is a single object for UI
      records = records.map(r => ({
        ...r,
        employee: Array.isArray(r.employee) ? r.employee[0] : r.employee,
      })) as SalaryRecord[];
      // Stable sort by employee_id so row order doesn't change after save/refetch
      records.sort((a, b) => {
        const idA = (a.employee as { employee_id?: string })?.employee_id ?? '';
        const idB = (b.employee as { employee_id?: string })?.employee_id ?? '';
        return idA.localeCompare(idB, undefined, { numeric: true });
      });
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

const SALARY_RECORD_UPDATE_KEYS = [
  'attendance_days', 'leave_unpaid', 'advance_taken', 'bonus',
  'penalty', 'increment_adjustment', 'total_calculated', 'status',
] as const;

function buildSalaryRecordUpdate(payload: Partial<SalaryRecord> & { id: string }): Record<string, number | string> {
  const { id: _id, ...rest } = payload;
  const update: Record<string, number | string> = {};
  for (const key of SALARY_RECORD_UPDATE_KEYS) {
    if (key in rest && rest[key as keyof typeof rest] !== undefined) {
      const v = rest[key as keyof typeof rest];
      if (key === 'status') {
        update[key] = String(v);
      } else {
        update[key] = Number(v);
      }
    }
  }
  return update;
}

export function useUpdateSalaryRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<SalaryRecord> & { id: string }) => {
      const id = payload.id;
      const updates = buildSalaryRecordUpdate(payload);
      if (Object.keys(updates).length === 0) {
        const { data, error } = await supabase.from('salary_records').select('*').eq('id', id).single();
        if (error) throw error;
        return data as SalaryRecord;
      }
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
      
      // Attendance is always 30 days every month
      const records = employees.map(emp => {
        const base = Number(emp.base_salary);
        return {
          employee_id: emp.id,
          month,
          year,
          attendance_days: ATTENDANCE_DAYS_PER_MONTH,
          leave_unpaid: 0,
          paid_leave: 0,
          advance_taken: 0,
          bonus: 0,
          penalty: 0,
          increment_adjustment: 0,
          days_in_month: ATTENDANCE_DAYS_PER_MONTH,
          total_calculated: calculateSalary(base, ATTENDANCE_DAYS_PER_MONTH, 0, 0, 0, 0, 0),
          status: 'Pending' as const,
        };
      });
      
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
