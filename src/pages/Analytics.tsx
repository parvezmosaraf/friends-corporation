import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Layout } from '@/components/Layout';
import { MonthYearFilter } from '@/components/MonthYearFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShops } from '@/hooks/useShops';
import { useShopPayrollSummary } from '@/hooks/useSalaryRecords';
import { formatCurrency, getMonthName } from '@/lib/types';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)'];

export default function Analytics() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: shops } = useShops();
  const classioShop = shops?.find((s) => s.name === 'Classio');
  const goodVibesShop = shops?.find((s) => s.name === 'Good Vibes');

  const { data: classioSummary } = useShopPayrollSummary(classioShop?.id || '', month, year);
  const { data: goodVibesSummary } = useShopPayrollSummary(goodVibesShop?.id || '', month, year);

  const barData = [
    {
      name: 'Classio',
      Total: classioSummary?.totalPayroll || 0,
      Paid: classioSummary?.totalPaid || 0,
      Pending: classioSummary?.totalPending || 0,
    },
    {
      name: 'Good Vibes',
      Total: goodVibesSummary?.totalPayroll || 0,
      Paid: goodVibesSummary?.totalPaid || 0,
      Pending: goodVibesSummary?.totalPending || 0,
    },
  ];

  const pieData = [
    { name: 'Classio', value: classioSummary?.totalPayroll || 0 },
    { name: 'Good Vibes', value: goodVibesSummary?.totalPayroll || 0 },
  ];

  const totalPayroll = (classioSummary?.totalPayroll || 0) + (goodVibesSummary?.totalPayroll || 0);

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
            <h1 className="page-title flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics
            </h1>
            <p className="page-subtitle">
              Salary distribution for {getMonthName(month)} {year}
            </p>
          </div>
          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </motion.div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payroll Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="Paid" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Payroll Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPayroll)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 md:grid-cols-2"
        >
          <Card className="gradient-classio text-white">
            <CardHeader>
              <CardTitle className="text-white">Classio Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/80">Total Payroll</span>
                <span className="font-bold">
                  {formatCurrency(classioSummary?.totalPayroll || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Paid</span>
                <span className="font-bold">
                  {formatCurrency(classioSummary?.totalPaid || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Pending</span>
                <span className="font-bold">
                  {formatCurrency(classioSummary?.totalPending || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-goodvibes text-white">
            <CardHeader>
              <CardTitle className="text-white">Good Vibes Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/80">Total Payroll</span>
                <span className="font-bold">
                  {formatCurrency(goodVibesSummary?.totalPayroll || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Paid</span>
                <span className="font-bold">
                  {formatCurrency(goodVibesSummary?.totalPaid || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Pending</span>
                <span className="font-bold">
                  {formatCurrency(goodVibesSummary?.totalPending || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
