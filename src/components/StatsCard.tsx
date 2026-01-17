import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'pending' | 'in-progress' | 'resolved';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  pending: 'bg-status-pending-bg border-status-pending/20',
  'in-progress': 'bg-status-in-progress-bg border-status-in-progress/20',
  resolved: 'bg-status-resolved-bg border-status-resolved/20',
};

const iconStyles = {
  default: 'text-muted-foreground',
  pending: 'text-status-pending',
  'in-progress': 'text-status-in-progress',
  resolved: 'text-status-resolved',
};

export function StatsCard({ title, value, icon: Icon, variant = 'default', className }: StatsCardProps) {
  return (
    <Card className={cn('transition-all hover:shadow-md', variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('p-3 rounded-full', variant === 'default' ? 'bg-muted' : 'bg-background/50')}>
            <Icon className={cn('h-6 w-6', iconStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
