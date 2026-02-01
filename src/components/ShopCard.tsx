import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { TakaIcon } from '@/components/TakaIcon';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/types';

interface ShopCardProps {
  id: string;
  name: string;
  employeeCount: number;
  totalPayroll: number;
  variant: 'classio' | 'goodvibes';
  delay?: number;
}

export function ShopCard({
  id,
  name,
  employeeCount,
  totalPayroll,
  variant,
  delay = 0,
}: ShopCardProps) {
  const isClassio = variant === 'classio';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <Link to={`/shop/${id}`} className="block">
        <div
          className={cn(
            'shop-card text-white',
            isClassio ? 'gradient-classio' : 'gradient-goodvibes'
          )}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>

          <div className="relative min-w-0">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{name}</h3>
            <p className="mt-1 text-sm sm:text-base text-white/80">Salary Management</p>

            <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-2 gap-3 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">Employees</p>
                  <p className="text-base sm:text-xl font-semibold truncate">{employeeCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <TakaIcon className="h-4 w-4 sm:h-5 sm:w-5 text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-white/70">This Month</p>
                  <p className="text-base sm:text-xl font-semibold truncate">{formatCurrency(totalPayroll)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8 flex items-center gap-2 text-xs sm:text-sm font-medium">
              <span>View Salary Sheet</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
