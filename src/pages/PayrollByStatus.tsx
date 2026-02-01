import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { MonthYearFilter } from '@/components/MonthYearFilter';
import { useSalaryRecords } from '@/hooks/useSalaryRecords';
import { formatCurrency, getMonthName } from '@/lib/types';
import type { SalaryRecord } from '@/lib/types';
import type { Employee } from '@/lib/types';

type RecordWithEmployee = SalaryRecord & { employee?: Employee };

export default function PayrollByStatus() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status'); // 'paid' | 'pending'
  const status: 'Paid' | 'Pending' =
    statusParam === 'paid' ? 'Paid' : statusParam === 'pending' ? 'Pending' : 'Paid';

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    const m = searchParams.get('month');
    const y = searchParams.get('year');
    if (m != null && y != null) {
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);
      if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2000 && yearNum <= 2100) {
        setMonth(monthNum);
        setYear(yearNum);
      }
    }
  }, [searchParams]);

  const { data: allRecords, isLoading } = useSalaryRecords(undefined, month, year);
  const records = (allRecords ?? []).filter((r) => r.status === status) as RecordWithEmployee[];

  const totalAmount = records.reduce((sum, r) => sum + Number(r.total_calculated ?? 0), 0);
  const title = status === 'Paid' ? 'Paid employees' : 'Pending employees';
  const subtitle =
    status === 'Paid'
      ? 'Employees whose salary has been disbursed this period'
      : 'Employees whose salary is yet to be processed';

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="page-title flex items-center gap-3">
              {status === 'Paid' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <Clock className="h-8 w-8 text-amber-600" />
              )}
              {title}
            </h1>
            <p className="page-subtitle">
              {getMonthName(month)} {year} — {subtitle}
            </p>
          </div>
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-12 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="border-b border-border bg-muted/50 px-4 py-3 sm:px-6">
              <p className="text-sm font-medium text-muted-foreground">
                {records.length} employee{records.length !== 1 ? 's' : ''} · Total{' '}
                {status === 'Paid' ? 'paid' : 'pending'}: {formatCurrency(totalAmount)}
              </p>
            </div>
            {records.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="font-medium">No {status.toLowerCase()} records for this period.</p>
                <p className="mt-1 text-sm">Change month/year or check the salary sheets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[320px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">Shop</th>
                      <th className="text-left font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">Employee</th>
                      <th className="text-left font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">Employee ID</th>
                      <th className="text-right font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">Amount</th>
                      <th className="text-center font-semibold px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const emp = record.employee;
                      const shopName = emp?.shop?.name ?? null;
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">{shopName ?? '—'}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">{emp?.name ?? '—'}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-muted-foreground">
                            {emp?.employee_id ?? '—'}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium whitespace-nowrap">
                            {formatCurrency(Number(record.total_calculated))}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <span
                              className={
                                record.status === 'Paid'
                                  ? 'badge-paid'
                                  : 'badge-pending'
                              }
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
