import { cn } from '@/lib/utils';

interface TakaIconProps {
  className?: string;
}

export function TakaIcon({ className }: TakaIconProps) {
  return (
    <span className={cn('inline-flex items-center justify-center font-semibold', className)} aria-hidden>
      ৳
    </span>
  );
}
