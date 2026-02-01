import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const variantStyles = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  primary: {
    iconBg: 'gradient-primary',
    iconColor: 'text-primary-foreground',
  },
  success: {
    iconBg: 'gradient-success',
    iconColor: 'text-success-foreground',
  },
  warning: {
    iconBg: 'gradient-warning',
    iconColor: 'text-warning-foreground',
  },
  danger: {
    iconBg: 'gradient-danger',
    iconColor: 'text-destructive-foreground',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            styles.iconBg
          )}
        >
          <Icon className={cn('h-6 w-6', styles.iconColor)} />
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-2xl" />
    </motion.div>
  );
}
