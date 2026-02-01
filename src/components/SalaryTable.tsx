import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SalaryRecord, Employee, formatCurrency, calculateSalary, ATTENDANCE_DAYS_PER_MONTH } from '@/lib/types';
import { useUpdateSalaryRecord } from '@/hooks/useSalaryRecords';
import { LeaveDialog } from '@/components/LeaveDialog';
import { cn } from '@/lib/utils';

interface SalaryTableProps {
  records: (SalaryRecord & { employee: Employee })[];
  isLoading?: boolean;
  month: number;
  year: number;
}

type RowDraft = {
  attendance_days: number;
  leave_unpaid: number;
  bonus: number;
  penalty: number;
  advance_taken: number;
  increment_adjustment: number;
};

function getRowValues(record: SalaryRecord & { employee?: Employee }, draft: RowDraft | null): RowDraft {
  if (draft) return draft;
  return {
    attendance_days: record.attendance_days,
    leave_unpaid: record.leave_unpaid,
    bonus: Number(record.bonus),
    penalty: Number(record.penalty),
    advance_taken: Number(record.advance_taken),
    increment_adjustment: Number(record.increment_adjustment),
  };
}

export function SalaryTable({ records, isLoading, month, year }: SalaryTableProps) {
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [leaveDialogRecord, setLeaveDialogRecord] = useState<(SalaryRecord & { employee?: Employee }) | null>(null);
  const updateSalaryRecord = useUpdateSalaryRecord();

  /** Attendance is always out of 30 days every month. */
  const daysInMonth = () => ATTENDANCE_DAYS_PER_MONTH;

  const updateDraft = (recordId: string, record: SalaryRecord & { employee?: Employee }, field: keyof RowDraft, value: number) => {
    const current = getRowValues(record, drafts[recordId] ?? null);
    setDrafts(prev => ({
      ...prev,
      [recordId]: { ...current, [field]: value },
    }));
  };

  /** Update attendance; leave (unpaid) = 30 - attendance */
  const updateDraftAttendance = (record: SalaryRecord & { employee?: Employee }, attendance: number) => {
    const current = getRowValues(record, drafts[record.id] ?? null);
    const days = daysInMonth();
    const attendanceClamped = Math.max(0, Math.min(days, attendance));
    const leaveUnpaid = Math.max(0, days - attendanceClamped);
    setDrafts(prev => ({
      ...prev,
      [record.id]: { ...current, attendance_days: attendanceClamped, leave_unpaid: leaveUnpaid },
    }));
  };

  /** Update leave (unpaid); attendance = 30 - leave */
  const updateDraftLeave = (record: SalaryRecord & { employee?: Employee }, leaveUnpaid: number) => {
    const current = getRowValues(record, drafts[record.id] ?? null);
    const days = daysInMonth();
    const leaveClamped = Math.max(0, Math.min(days, leaveUnpaid));
    const attendance = Math.max(0, days - leaveClamped);
    setDrafts(prev => ({
      ...prev,
      [record.id]: { ...current, leave_unpaid: leaveClamped, attendance_days: attendance },
    }));
  };

  const saveRow = async (record: SalaryRecord & { employee: Employee }) => {
    const values = getRowValues(record, drafts[record.id] ?? null);
    const baseSalary = Number(record.employee?.base_salary);
    const days = daysInMonth();
    // Use draft/edited values so the user's attendance change is saved (not recalculated from server leave)
    const attendanceDays = Math.max(0, Math.min(days, values.attendance_days));
    const leaveUnpaid = Math.max(0, days - attendanceDays);
    const total = calculateSalary(
      baseSalary,
      attendanceDays,
      0, // paid leave not used
      values.bonus,
      values.increment_adjustment,
      values.advance_taken,
      values.penalty,
      days
    );

    try {
      await updateSalaryRecord.mutateAsync({
        id: record.id,
        attendance_days: attendanceDays,
        leave_unpaid: leaveUnpaid,
        bonus: values.bonus,
        penalty: values.penalty,
        advance_taken: values.advance_taken,
        increment_adjustment: values.increment_adjustment,
        total_calculated: total,
      });
      setDrafts(prev => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
    } catch {
      // Error toast is shown by mutation onError; keep draft so user can retry
    }
  };

  const toggleStatus = async (record: SalaryRecord) => {
    await updateSalaryRecord.mutateAsync({
      id: record.id,
      status: record.status === 'Paid' ? 'Pending' : 'Paid',
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No salary records found for this period.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate salary records to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <p className="px-4 py-3 text-xs text-muted-foreground border-b border-border/50 bg-muted/30 md:px-4">
        <strong>Base Salary</strong> is the fixed monthly amount. <strong>Attendance</strong> is calculated on 30 days every month. <strong>Total</strong> = (Base ÷ 30) × attendance + bonus − advance − penalty. Full attendance (30/30) = full Base Salary.
      </p>
      {/* Mobile View - Cards with editable inputs */}
      <div className="md:hidden">
        {records.map((record, index) => {
          const values = getRowValues(record, drafts[record.id] ?? null);
          const total = calculateSalary(
            Number(record.employee?.base_salary),
            values.attendance_days,
            0,
            values.bonus,
            values.increment_adjustment,
            values.advance_taken,
            values.penalty,
            ATTENDANCE_DAYS_PER_MONTH
          );
          return (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-border p-3 sm:p-4 last:border-b-0 space-y-3 min-w-0"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{record.employee?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{record.employee?.employee_id}</p>
                </div>
                <span className={record.status === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                  {record.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm min-w-0">
                <div className="min-w-0">
                  <label className="text-muted-foreground block text-xs mb-0.5">Attendance (days)</label>
                  <Input
                    type="number"
                    min={0}
                    max={ATTENDANCE_DAYS_PER_MONTH}
                    className="h-9 min-h-touch"
                    value={values.attendance_days === 0 ? '' : values.attendance_days}
                    onChange={(e) => updateDraftAttendance(record, parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs text-muted-foreground">/ {ATTENDANCE_DAYS_PER_MONTH}</span>
                </div>
                <div>
                  <label className="text-muted-foreground block text-xs mb-0.5">Leave (unpaid)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{record.leave_unpaid} day{record.leave_unpaid !== 1 ? 's' : ''}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 min-h-touch gap-1"
                      onClick={() => setLeaveDialogRecord(record)}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Manage
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground block text-xs mb-0.5">Bonus (৳)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-9 min-h-touch"
                    value={values.bonus === 0 ? '' : values.bonus}
                    onChange={(e) => updateDraft(record.id, record, 'bonus', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block text-xs mb-0.5">Advance (৳)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-9 min-h-touch"
                    value={values.advance_taken === 0 ? '' : values.advance_taken}
                    onChange={(e) => updateDraft(record.id, record, 'advance_taken', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block text-xs mb-0.5">Penalty (৳)</label>
                  <Input
                    type="number"
                    min={0}
                    className="h-9 min-h-touch"
                    value={values.penalty === 0 ? '' : values.penalty}
                    onChange={(e) => updateDraft(record.id, record, 'penalty', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block text-xs mb-0.5">Increment (৳)</label>
                  <Input
                    type="number"
                    className="h-9 min-h-touch"
                    value={values.increment_adjustment === 0 ? '' : values.increment_adjustment}
                    onChange={(e) => updateDraft(record.id, record, 'increment_adjustment', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <span className="text-muted-foreground text-sm">Total: </span>
                  <span className="text-lg font-bold">{formatCurrency(total)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveRow(record)}
                    disabled={updateSalaryRecord.isPending}
                    className="gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Switch
                    checked={record.status === 'Paid'}
                    onCheckedChange={() => toggleStatus(record)}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop View - Table with inputs in every editable column */}
      <div className="hidden md:block overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="rounded-tl-lg">Employee</th>
              <th>Base Salary</th>
              <th>Attendance</th>
              <th>Leave (Unpaid)</th>
              <th>Bonus</th>
              <th>Advance</th>
              <th>Penalty</th>
              <th>Increment</th>
              <th>Total</th>
              <th>Status</th>
              <th className="rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const values = getRowValues(record, drafts[record.id] ?? null);
              const total = calculateSalary(
                Number(record.employee?.base_salary),
                values.attendance_days,
                0,
                values.bonus,
                values.increment_adjustment,
                values.advance_taken,
                values.penalty,
                ATTENDANCE_DAYS_PER_MONTH
              );

              return (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td>
                    <div>
                      <p className="font-medium">{record.employee?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.employee?.employee_id}
                      </p>
                    </div>
                  </td>
                  <td>{formatCurrency(Number(record.employee?.base_salary))}</td>
                  <td>
                    <Input
                      type="number"
                      min={0}
                      max={ATTENDANCE_DAYS_PER_MONTH}
                      className="w-20 h-9 text-sm"
                      value={values.attendance_days === 0 ? '' : values.attendance_days}
                      onChange={(e) => updateDraftAttendance(record, parseInt(e.target.value) || 0)}
                      title={`Days present (max ${ATTENDANCE_DAYS_PER_MONTH})`}
                    />
                    <span className="text-xs text-muted-foreground ml-1">/ {ATTENDANCE_DAYS_PER_MONTH}</span>
                  </td>
                  <td title="Date-wise leave: add dates in Manage">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{record.leave_unpaid} day{record.leave_unpaid !== 1 ? 's' : ''}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setLeaveDialogRecord(record)}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                    </div>
                  </td>
                  <td className="text-success">
                    <Input
                      type="number"
                      min={0}
                      className="w-24 h-9 text-sm"
                      value={values.bonus === 0 ? '' : values.bonus}
                      onChange={(e) => updateDraft(record.id, record, 'bonus', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="text-destructive">
                    <Input
                      type="number"
                      min={0}
                      className="w-24 h-9 text-sm"
                      value={values.advance_taken === 0 ? '' : values.advance_taken}
                      onChange={(e) => updateDraft(record.id, record, 'advance_taken', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="text-destructive">
                    <Input
                      type="number"
                      min={0}
                      className="w-24 h-9 text-sm"
                      value={values.penalty === 0 ? '' : values.penalty}
                      onChange={(e) => updateDraft(record.id, record, 'penalty', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="text-primary">
                    <Input
                      type="number"
                      className="w-24 h-9 text-sm"
                      value={values.increment_adjustment === 0 ? '' : values.increment_adjustment}
                      onChange={(e) => updateDraft(record.id, record, 'increment_adjustment', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="font-bold">
                    {formatCurrency(total)}
                  </td>
                  <td>
                    <span
                      className={
                        record.status === 'Paid' ? 'badge-paid' : 'badge-pending'
                      }
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1 h-9"
                        onClick={() => saveRow(record)}
                        disabled={updateSalaryRecord.isPending}
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Switch
                        checked={record.status === 'Paid'}
                        onCheckedChange={() => toggleStatus(record)}
                      />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {leaveDialogRecord && (
        <LeaveDialog
          open={!!leaveDialogRecord}
          onOpenChange={(open) => !open && setLeaveDialogRecord(null)}
          record={leaveDialogRecord}
          month={month}
          year={year}
        />
      )}
    </div>
  );
}
