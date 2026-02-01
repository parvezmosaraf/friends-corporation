export interface Shop {
  id: string;
  name: string;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  designation: string | null;
  base_salary: number;
  shop_id: string;
  created_at: string;
  updated_at: string;
  shop?: Shop;
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  attendance_days: number;
  leave_unpaid: number;
  paid_leave: number;
  advance_taken: number;
  bonus: number;
  penalty: number;
  increment_adjustment: number;
  total_calculated: number;
  status: 'Paid' | 'Pending';
  days_in_month: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface PayrollSummary {
  totalPayroll: number;
  totalPaid: number;
  totalPending: number;
}

export type MonthOption = {
  value: number;
  label: string;
};

export const MONTHS: MonthOption[] = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function calculateSalary(
  baseSalary: number,
  attendanceDays: number,
  paidLeave: number,
  bonus: number,
  incrementAdjustment: number,
  advanceTaken: number,
  penalty: number,
  daysInMonth: number = 30
): number {
  const dailyRate = baseSalary / daysInMonth;
  const total =
    attendanceDays * dailyRate +
    paidLeave * dailyRate +
    bonus +
    incrementAdjustment -
    advanceTaken -
    penalty;
  return Math.max(0, Math.round(total * 100) / 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getMonthName(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label || '';
}
