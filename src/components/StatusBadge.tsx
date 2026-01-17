import { cn } from '@/lib/utils';
import type { ComplaintStatus } from '@/types/database';
import { Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

const statusConfig: Record<ComplaintStatus, { icon: React.ComponentType<any>; label: string; className: string }> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))]',
  },
  in_progress: {
    icon: Loader2,
    label: 'Ongoing',
    className: 'bg-[hsl(var(--status-in-progress-bg))] text-[hsl(var(--status-in-progress))]',
  },
  waiting_confirmation: {
    icon: AlertCircle,
    label: 'Awaiting Confirmation',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  resolved: {
    icon: CheckCircle2,
    label: 'Resolved',
    className: 'bg-[hsl(var(--status-resolved-bg))] text-[hsl(var(--status-resolved))]',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'status-badge gap-1.5',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'in_progress' && 'animate-spin')} />
      {config.label}
    </span>
  );
}
