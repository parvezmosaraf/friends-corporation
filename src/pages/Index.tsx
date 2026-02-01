import { motion } from 'framer-motion';
import { TrendingUp, Clock, Wallet } from 'lucide-react';
import { TakaIcon } from '@/components/TakaIcon';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { ShopCard } from '@/components/ShopCard';
import { MonthYearFilter } from '@/components/MonthYearFilter';
import { useShops } from '@/hooks/useShops';
import { useEmployees } from '@/hooks/useEmployees';
import { useSalaryRecords } from '@/hooks/useSalaryRecords';
import { formatCurrency, calculateSalary } from '@/lib/types';
import { useState, useMemo } from 'react';

export default function Index() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: shops, isLoading: shopsLoading, isError: shopsError, error: shopsErrorDetail } = useShops();
  const { data: employees } = useEmployees();
  const { data: records } = useSalaryRecords(undefined, month, year);

  const classioShop = shops?.find((s) => s.name === 'Classio');
  const goodVibesShop = shops?.find((s) => s.name === 'Good Vibes');

  const classioEmployees = employees?.filter((e) => e.shop_id === classioShop?.id) || [];
  const goodVibesEmployees = employees?.filter((e) => e.shop_id === goodVibesShop?.id) || [];

  // Derive summary and shop totals; Total Paid = salary disbursed (status=Paid) + advance already given
  const { summary, classioTotal, goodVibesTotal } = useMemo(() => {
    const recs = records ?? [];
    let totalPayroll = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalAdvance = 0;
    let classio = 0;
    let goodVibes = 0;
    const classioId = classioShop?.id;
    const goodVibesId = goodVibesShop?.id;

    recs.forEach((r) => {
      const base = Number(r.employee?.base_salary ?? 0);
      const days = 30; // attendance always 30 days per month
      const total = calculateSalary(
        base,
        r.attendance_days,
        Number(r.paid_leave ?? 0),
        Number(r.bonus ?? 0),
        Number(r.increment_adjustment ?? 0),
        Number(r.advance_taken ?? 0),
        Number(r.penalty ?? 0),
        days
      );
      totalPayroll += total;
      if (r.status === 'Paid') totalPaid += total;
      else totalPending += total;
      totalAdvance += Number(r.advance_taken ?? 0);

      const shopId = (r.employee as { shop_id?: string })?.shop_id;
      if (shopId === classioId) classio += total;
      if (shopId === goodVibesId) goodVibes += total;
    });

    return {
      summary: { totalPayroll, totalPaid, totalPending, totalAdvance },
      classioTotal: classio,
      goodVibesTotal: goodVibes,
    };
  }, [records, classioShop?.id, goodVibesShop?.id]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between min-w-0"
        >
          <div className="min-w-0">
            <h1 className="page-title">
              Welcome back to{' '}
              <span className="text-gradient-primary">Friends Corporation</span>
            </h1>
            <p className="page-subtitle">Manage salaries across all your shops</p>
          </div>
          <div className="w-full md:w-auto min-w-0">
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
          </div>
        </motion.div>

        {/* Stats Grid - click to view details */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
          <StatCard
            title="Total Payroll"
            value={formatCurrency(summary?.totalPayroll || 0)}
            subtitle="This month across all shops"
            icon={TakaIcon}
            variant="primary"
            delay={0}
            to={`/analytics?month=${month}&year=${year}`}
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency((summary?.totalPaid ?? 0) + (summary?.totalAdvance ?? 0))}
            subtitle="Disbursed + advance given"
            icon={TrendingUp}
            variant="success"
            delay={0.1}
            to={`/payroll?status=paid&month=${month}&year=${year}`}
          />
          <StatCard
            title="Pending Amount"
            value={formatCurrency(summary?.totalPending || 0)}
            subtitle="Yet to be processed"
            icon={Clock}
            variant="warning"
            delay={0.2}
            to={`/payroll?status=pending&month=${month}&year=${year}`}
          />
          <StatCard
            title="Total Employees"
            value={(employees?.length || 0).toString()}
            subtitle="Active workforce"
            icon={Wallet}
            variant="default"
            delay={0.3}
            to="/admin"
          />
        </div>

        {/* Shop Cards */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6 text-xl font-semibold"
          >
            Select Shop
          </motion.h2>

          {shopsLoading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 min-w-0">
              <div className="h-48 animate-pulse rounded-3xl bg-muted" />
              <div className="h-48 animate-pulse rounded-3xl bg-muted" />
            </div>
          ) : shopsError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="font-medium text-destructive">Could not load shops</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {shopsErrorDetail?.message ?? 'Check your Supabase connection.'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ensure <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> and{' '}
                <code className="rounded bg-muted px-1">VITE_SUPABASE_PUBLISHABLE_KEY</code> are set in{' '}
                <code className="rounded bg-muted px-1">.env</code> and the database migration has been run.
              </p>
            </div>
          ) : !shops?.length ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="font-medium">No shops found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Run the Supabase migration to create the <code className="rounded bg-muted px-1">shops</code> table
                and seed &quot;Classio&quot; and &quot;Good Vibes&quot;. Apply the SQL in{' '}
                <code className="rounded bg-muted px-1">supabase/migrations/</code>.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 min-w-0">
              {classioShop && (
                <ShopCard
                  id={classioShop.id}
                  name="Classio"
                  employeeCount={classioEmployees.length}
                  totalPayroll={classioTotal}
                  variant="classio"
                  delay={0.5}
                />
              )}
              {goodVibesShop && (
                <ShopCard
                  id={goodVibesShop.id}
                  name="Good Vibes"
                  employeeCount={goodVibesEmployees.length}
                  totalPayroll={goodVibesTotal}
                  variant="goodvibes"
                  delay={0.6}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
