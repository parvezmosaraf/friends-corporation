import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SalaryRecord, Employee, formatCurrency, calculateSalary } from '@/lib/types';
import { useUpdateSalaryRecord } from '@/hooks/useSalaryRecords';
import { cn } from '@/lib/utils';

interface SalaryTableProps {
  records: (SalaryRecord & { employee: Employee })[];
  isLoading?: boolean;
}

interface EditingRow {
  id: string;
  attendance_days: number;
  paid_leave: number;
  leave_unpaid: number;
  bonus: number;
  penalty: number;
  advance_taken: number;
  increment_adjustment: number;
}

export function SalaryTable({ records, isLoading }: SalaryTableProps) {
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const updateSalaryRecord = useUpdateSalaryRecord();

  const startEditing = (record: SalaryRecord) => {
    setEditingRow({
      id: record.id,
      attendance_days: record.attendance_days,
      paid_leave: record.paid_leave,
      leave_unpaid: record.leave_unpaid,
      bonus: Number(record.bonus),
      penalty: Number(record.penalty),
      advance_taken: Number(record.advance_taken),
      increment_adjustment: Number(record.increment_adjustment),
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
  };

  const saveEditing = async (record: SalaryRecord & { employee: Employee }) => {
    if (!editingRow) return;

    const baseSalary = Number(record.employee.base_salary);
    const total = calculateSalary(
      baseSalary,
      editingRow.attendance_days,
      editingRow.paid_leave,
      editingRow.bonus,
      editingRow.increment_adjustment,
      editingRow.advance_taken,
      editingRow.penalty,
      record.days_in_month
    );

    await updateSalaryRecord.mutateAsync({
      id: editingRow.id,
      attendance_days: editingRow.attendance_days,
      paid_leave: editingRow.paid_leave,
      leave_unpaid: editingRow.leave_unpaid,
      bonus: editingRow.bonus,
      penalty: editingRow.penalty,
      advance_taken: editingRow.advance_taken,
      increment_adjustment: editingRow.increment_adjustment,
      total_calculated: total,
    });

    setEditingRow(null);
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
      {/* Mobile View - Cards */}
      <div className="md:hidden">
        {records.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b border-border p-4 last:border-b-0"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">{record.employee?.name}</p>
                <p className="text-sm text-muted-foreground">{record.employee?.employee_id}</p>
              </div>
              <span className={record.status === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                {record.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Attendance:</span>{' '}
                <span className="font-medium">{record.attendance_days} days</span>
              </div>
              <div>
                <span className="text-muted-foreground">Base:</span>{' '}
                <span className="font-medium">{formatCurrency(Number(record.employee?.base_salary))}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Bonus:</span>{' '}
                <span className="font-medium text-success">{formatCurrency(Number(record.bonus))}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deductions:</span>{' '}
                <span className="font-medium text-destructive">
                  {formatCurrency(Number(record.advance_taken) + Number(record.penalty))}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <span className="text-muted-foreground text-sm">Total:</span>{' '}
                <span className="text-lg font-bold">{formatCurrency(Number(record.total_calculated))}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => startEditing(record)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Switch
                  checked={record.status === 'Paid'}
                  onCheckedChange={() => toggleStatus(record)}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="rounded-tl-lg">Employee</th>
              <th>Base Salary</th>
              <th>Attendance</th>
              <th>Paid Leave</th>
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
              const isEditing = editingRow?.id === record.id;

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
                    {isEditing ? (
                      <Input
                        type="number"
                        className="w-16 h-8"
                        value={editingRow.attendance_days}
                        onChange={(e) =>
                          setEditingRow({
                            ...editingRow,
                            attendance_days: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      `${record.attendance_days}/${record.days_in_month}`
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <Input
                        type="number"
                        className="w-16 h-8"
                        value={editingRow.paid_leave}
                        onChange={(e) =>
                          setEditingRow({
                            ...editingRow,
                            paid_leave: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      record.paid_leave
                    )}
                  </td>
                  <td className="text-success">
                    {isEditing ? (
                      <Input
                        type="number"
                        className="w-20 h-8"
                        value={editingRow.bonus}
                        onChange={(e) =>
                          setEditingRow({
                            ...editingRow,
                            bonus: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      formatCurrency(Number(record.bonus))
                    )}
                  </td>
                  <td className="text-destructive">
                    {isEditing ? (
                      <Input
                        type="number"
                        className="w-20 h-8"
                        value={editingRow.advance_taken}
                        onChange={(e) =>
                          setEditingRow({
                            ...editingRow,
                            advance_taken: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      formatCurrency(Number(record.advance_taken))
                    )}
                  </td>
                  <td className="text-destructive">
                    {isEditing ? (
                      <Input
                        type="number"
                        className="w-20 h-8"
                        value={editingRow.penalty}
                        onChange={(e) =>
                          setEditingRow({
                            ...editingRow,
                            penalty: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      formatCurrency(Number(record.penalty))
                    )}
                  </td>
                  <td className="text-primary">
                    {isEditing ? (
                      <Input
                        type="number"
                        className="w-20 h-8"
                        value={editingRow.increment_adjustment}
                        onChange={(e) =>
                          setEditingRow({
                            ...editingRow,
                            increment_adjustment: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      formatCurrency(Number(record.increment_adjustment))
                    )}
                  </td>
                  <td className="font-bold">
                    {formatCurrency(Number(record.total_calculated))}
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
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => saveEditing(record)}
                            disabled={updateSalaryRecord.isPending}
                          >
                            <Save className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditing(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={record.status === 'Paid'}
                            onCheckedChange={() => toggleStatus(record)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
