import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  delay?: number;
  /** When set, the card is clickable and navigates to this path (e.g. /analytics). */
  to?: string;
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
  to,
}: StatCardProps) {
  const styles = variantStyles[variant];

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold tracking-tight break-all">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            styles.iconBg
          )}
        >
          <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', styles.iconColor)} />
        </div>
      </div>
      {/* Decorative element */}
      <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-2xl" />
    </>
  );

  const cardClassName = cn(
    'stat-card group relative overflow-hidden',
    to && 'cursor-pointer transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cardClassName}
    >
      {to ? (
        <Link to={to} className="block focus:outline-none" aria-label={`View ${title}`}>
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
    </motion.div>
  );
}
