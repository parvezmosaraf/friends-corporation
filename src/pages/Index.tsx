import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, Wallet } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { ShopCard } from '@/components/ShopCard';
import { MonthYearFilter } from '@/components/MonthYearFilter';
import { useShops } from '@/hooks/useShops';
import { useEmployees } from '@/hooks/useEmployees';
import { usePayrollSummary, useShopPayrollSummary } from '@/hooks/useSalaryRecords';
import { formatCurrency } from '@/lib/types';
import { useState } from 'react';

export default function Index() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: shops, isLoading: shopsLoading } = useShops();
  const { data: employees } = useEmployees();
  const { data: summary } = usePayrollSummary(month, year);

  const classioShop = shops?.find((s) => s.name === 'Classio');
  const goodVibesShop = shops?.find((s) => s.name === 'Good Vibes');

  const classioEmployees = employees?.filter((e) => e.shop_id === classioShop?.id) || [];
  const goodVibesEmployees = employees?.filter((e) => e.shop_id === goodVibesShop?.id) || [];

  const { data: classioSummary } = useShopPayrollSummary(classioShop?.id || '', month, year);
  const { data: goodVibesSummary } = useShopPayrollSummary(goodVibesShop?.id || '', month, year);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="page-title">
              Welcome back to{' '}
              <span className="text-gradient-primary">Friends Corporation</span>
            </h1>
            <p className="page-subtitle">Manage salaries across all your shops</p>
          </div>
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Payroll"
            value={formatCurrency(summary?.totalPayroll || 0)}
            subtitle="This month across all shops"
            icon={DollarSign}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency(summary?.totalPaid || 0)}
            subtitle="Successfully disbursed"
            icon={TrendingUp}
            variant="success"
            delay={0.1}
          />
          <StatCard
            title="Pending Amount"
            value={formatCurrency(summary?.totalPending || 0)}
            subtitle="Yet to be processed"
            icon={Clock}
            variant="warning"
            delay={0.2}
          />
          <StatCard
            title="Total Employees"
            value={(employees?.length || 0).toString()}
            subtitle="Active workforce"
            icon={Wallet}
            variant="default"
            delay={0.3}
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

          <div className="grid gap-6 md:grid-cols-2">
            {classioShop && (
              <ShopCard
                id={classioShop.id}
                name="Classio"
                employeeCount={classioEmployees.length}
                totalPayroll={classioSummary?.totalPayroll || 0}
                variant="classio"
                delay={0.5}
              />
            )}
            {goodVibesShop && (
              <ShopCard
                id={goodVibesShop.id}
                name="Good Vibes"
                employeeCount={goodVibesEmployees.length}
                totalPayroll={goodVibesSummary?.totalPayroll || 0}
                variant="goodvibes"
                delay={0.6}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
