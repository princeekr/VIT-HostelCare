import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import type { Complaint } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, Pencil, Trash2, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplaintCardProps {
  complaint: Complaint;
  showLocation?: boolean;
  showActions?: boolean;
  onEdit?: (complaint: Complaint) => void;
  onDelete?: (complaint: Complaint) => void;
  onClick?: (complaint: Complaint) => void;
  className?: string;
}

export function ComplaintCard({
  complaint,
  showLocation = true,
  showActions = false,
  onEdit,
  onDelete,
  onClick,
  className,
}: ComplaintCardProps) {
  const canEdit = complaint.status === 'pending';
  const locationParts = [complaint.hostel_name, complaint.block, complaint.floor, complaint.room_number]
    .filter(Boolean)
    .join(' • ');

  return (
    <Card 
      className={cn(
        'transition-all hover:shadow-md animate-fade-in',
        onClick && 'cursor-pointer hover:border-primary/50',
        className
      )}
      onClick={() => onClick?.(complaint)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{complaint.title}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <CategoryBadge category={complaint.category} />
              {complaint.photo_url && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Image className="h-3 w-3" />
                  Photo
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-muted-foreground text-sm line-clamp-2">{complaint.description}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {showLocation && locationParts && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {locationParts}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
      {showActions && canEdit && (
        <CardFooter className="pt-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(complaint);
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(complaint);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
