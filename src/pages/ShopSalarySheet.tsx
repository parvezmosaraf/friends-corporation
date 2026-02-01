import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, DollarSign, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { MonthYearFilter } from '@/components/MonthYearFilter';
import { SalaryTable } from '@/components/SalaryTable';
import { Button } from '@/components/ui/button';
import { useShop } from '@/hooks/useShops';
import { useSalaryRecords, useShopPayrollSummary, useGenerateSalaryRecords } from '@/hooks/useSalaryRecords';
import { formatCurrency, getMonthName } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ShopSalarySheet() {
  const { shopId } = useParams<{ shopId: string }>();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: shop, isLoading: shopLoading } = useShop(shopId || '');
  const { data: records, isLoading: recordsLoading } = useSalaryRecords(shopId, month, year);
  const { data: summary } = useShopPayrollSummary(shopId || '', month, year);
  const generateRecords = useGenerateSalaryRecords();

  const isClassio = shop?.name === 'Classio';
  const gradientClass = isClassio ? 'gradient-classio' : 'gradient-goodvibes';

  const handleGenerate = () => {
    if (shopId) {
      generateRecords.mutate({ shopId, month, year });
    }
  };

  if (shopLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', gradientClass)}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{shop?.name}</h1>
                  <p className="text-muted-foreground">
                    Salary Sheet for {getMonthName(month)} {year}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center gap-3">
              <MonthYearFilter
                month={month}
                year={year}
                onMonthChange={setMonth}
                onYearChange={setYear}
              />
              <Button
                onClick={handleGenerate}
                disabled={generateRecords.isPending}
                className={cn(gradientClass, 'text-white border-0')}
              >
                {generateRecords.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generate Records
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Payroll"
            value={formatCurrency(summary?.totalPayroll || 0)}
            icon={DollarSign}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Paid"
            value={formatCurrency(summary?.totalPaid || 0)}
            icon={CheckCircle}
            variant="success"
            delay={0.1}
          />
          <StatCard
            title="Pending"
            value={formatCurrency(summary?.totalPending || 0)}
            icon={Clock}
            variant="warning"
            delay={0.2}
          />
        </div>

        {/* Salary Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SalaryTable
            records={(records || []) as any}
            isLoading={recordsLoading}
          />
        </motion.div>
      </div>
    </Layout>
  );
}
