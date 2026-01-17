import { cn } from '@/lib/utils';
import type { ComplaintPriority } from '@/types/database';
import { PRIORITY_LABELS } from '@/types/database';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  className?: string;
}

const priorityConfig = {
  low: 'bg-priority-low-bg text-priority-low',
  medium: 'bg-priority-medium-bg text-priority-medium',
  high: 'bg-priority-high-bg text-priority-high',
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span className={cn('status-badge', priorityConfig[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
