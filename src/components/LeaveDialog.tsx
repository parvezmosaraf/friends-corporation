import { useState } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLeaveEntries, useAddLeaveEntry, useDeleteLeaveEntry } from '@/hooks/useLeaveEntries';
import { SalaryRecord } from '@/lib/types';
import { Employee } from '@/lib/types';
import { getMonthName } from '@/lib/types';
import { LeaveEntry } from '@/lib/types';

function getMonthDateRange(month: number, year: number): { min: string; max: string } {
  const lastDate = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    min: `${year}-${pad(month)}-01`,
    max: `${year}-${pad(month)}-${pad(lastDate)}`,
  };
}

function formatLeaveDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface LeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalaryRecord & { employee?: Employee };
  month: number;
  year: number;
}

export function LeaveDialog({ open, onOpenChange, record, month, year }: LeaveDialogProps) {
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const { data: entries = [], isLoading } = useLeaveEntries(record.id);
  const addLeave = useAddLeaveEntry();
  const deleteLeave = useDeleteLeaveEntry();
  const { min, max } = getMonthDateRange(month, year);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate.trim()) return;
    await addLeave.mutateAsync({
      salary_record_id: record.id,
      leave_date: leaveDate,
      reason: leaveReason.trim() || null,
    });
    setLeaveDate('');
    setLeaveReason('');
  };

  const handleDelete = async (entry: LeaveEntry) => {
    await deleteLeave.mutateAsync({
      id: entry.id,
      salary_record_id: record.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave – {record.employee?.name ?? 'Employee'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {getMonthName(month)} {year}. Add leave dates; leave days are calculated from the dates you add.
        </p>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leave-date">Leave date</Label>
              <Input
                id="leave-date"
                type="date"
                min={min}
                max={max}
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Reason (optional)</Label>
              <Input
                id="leave-reason"
                type="text"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={addLeave.isPending} className="w-full sm:w-auto">
            {addLeave.isPending ? 'Adding…' : 'Add leave date'}
          </Button>
        </form>

        <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium">
            Leave entries ({entries.length} day{entries.length !== 1 ? 's' : ''})
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave dates added yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{formatLeaveDate(entry.leave_date)}</span>
                    {entry.reason && (
                      <span className="ml-2 text-muted-foreground">– {entry.reason}</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry)}
                    disabled={deleteLeave.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
