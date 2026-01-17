import { cn } from '@/lib/utils';
import type { ComplaintCategory } from '@/types/database';
import { CATEGORY_LABELS } from '@/types/database';
import { Zap, Droplets, Sparkles, Wifi, Wrench, Armchair, HelpCircle } from 'lucide-react';

interface CategoryBadgeProps {
  category: ComplaintCategory;
  className?: string;
}

const categoryIcons = {
  electricity: Zap,
  water: Droplets,
  cleaning: Sparkles,
  wifi: Wifi,
  plumbing: Wrench,
  furniture: Armchair,
  other: HelpCircle,
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const Icon = categoryIcons[category];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      <Icon className="h-4 w-4" />
      {CATEGORY_LABELS[category]}
    </span>
  );
}
