import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeaveEntry } from '@/lib/types';
import { calculateSalary, ATTENDANCE_DAYS_PER_MONTH } from '@/lib/types';
import { toast } from 'sonner';

export function useLeaveEntries(salaryRecordId: string) {
  return useQuery({
    queryKey: ['leave_entries', salaryRecordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_entries')
        .select('*')
        .eq('salary_record_id', salaryRecordId)
        .order('leave_date', { ascending: true });
      if (error) throw error;
      return (data || []) as LeaveEntry[];
    },
    enabled: !!salaryRecordId,
  });
}

function syncSalaryRecordFromLeaveCount(
  queryClient: ReturnType<typeof useQueryClient>,
  salaryRecordId: string,
  leaveCount: number
) {
  return async () => {
    const { data: record, error: fetchError } = await supabase
      .from('salary_records')
      .select('*, employee:employees(*)')
      .eq('id', salaryRecordId)
      .single();
    if (fetchError || !record) return;
    const rec = record as any;
    const paidLeave = Number(rec.paid_leave ?? 0);
    const baseSalary = Number(rec.employee?.base_salary ?? 0);
    const attendanceDays = Math.max(0, ATTENDANCE_DAYS_PER_MONTH - paidLeave - leaveCount);
    const total = calculateSalary(
      baseSalary,
      attendanceDays,
      paidLeave,
      Number(rec.bonus ?? 0),
      Number(rec.increment_adjustment ?? 0),
      Number(rec.advance_taken ?? 0),
      Number(rec.penalty ?? 0)
    );
    await supabase
      .from('salary_records')
      .update({
        leave_unpaid: leaveCount,
        attendance_days: attendanceDays,
        total_calculated: total,
      })
      .eq('id', salaryRecordId);
    queryClient.invalidateQueries({ queryKey: ['salary_records'] });
    queryClient.invalidateQueries({ queryKey: ['payroll_summary'] });
    queryClient.invalidateQueries({ queryKey: ['shop_payroll_summary'] });
  };
}

export function useAddLeaveEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      salary_record_id,
      leave_date,
      reason,
    }: {
      salary_record_id: string;
      leave_date: string;
      reason?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('leave_entries')
        .insert({ salary_record_id, leave_date, reason: reason || null })
        .select()
        .single();
      if (error) throw error;
      const { data: allEntries } = await supabase
        .from('leave_entries')
        .select('id')
        .eq('salary_record_id', salary_record_id);
      const leaveCount = (allEntries?.length ?? 0);
      await syncSalaryRecordFromLeaveCount(queryClient, salary_record_id, leaveCount)();
      return data as LeaveEntry;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave_entries', variables.salary_record_id] });
      toast.success('Leave date added');
    },
    onError: (e: Error) => {
      toast.error(e.message ?? 'Failed to add leave');
    },
  });
}

export function useDeleteLeaveEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      salary_record_id,
    }: {
      id: string;
      salary_record_id: string;
    }) => {
      const { error } = await supabase.from('leave_entries').delete().eq('id', id);
      if (error) throw error;
      const { data: remaining } = await supabase
        .from('leave_entries')
        .select('id')
        .eq('salary_record_id', salary_record_id);
      const leaveCount = remaining?.length ?? 0;
      await syncSalaryRecordFromLeaveCount(queryClient, salary_record_id, leaveCount)();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave_entries', variables.salary_record_id] });
      toast.success('Leave date removed');
    },
    onError: (e: Error) => {
      toast.error(e.message ?? 'Failed to remove leave');
    },
  });
}
