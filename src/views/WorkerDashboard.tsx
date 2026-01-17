import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ComplaintCard } from '@/components/ComplaintCard';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Complaint } from '@/types/database';
import { Loader2, ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // Resolve dialog state
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  const fetchWorkerAndComplaints = async () => {
    if (!user) return;

    try {
      const workers = await apiFetch(`/api/workers?user_id=${user.id}`);
      const workerData = workers[0]; // Assuming one worker record per user

      if (workerData) {
        setWorkerId(workerData.id);

        // Fetch complaints assigned to this worker
        const complaintsData = await apiFetch(`/api/complaints?assigned_worker_id=${workerData.id}`);
        setComplaints(complaintsData);
      }
    } catch (error) {
      console.error('Failed to fetch worker data:', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWorkerAndComplaints();
  }, [user]);

  useEffect(() => {
    if (!workerId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('worker-complaints')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `assigned_worker_id=eq.${workerId}`,
        },
        () => {
          fetchWorkerAndComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  const handleComplaintClick = (complaint: Complaint) => {
    // Only allow marking as resolved for in_progress complaints
    if (complaint.status === 'in_progress') {
      setResolvingComplaint(complaint);
      setResolveDialogOpen(true);
    }
  };

  const handleMarkResolved = async () => {
    if (!resolvingComplaint) return;
    setResolveLoading(true);

    try {
      await apiFetch('/api/complaints', {
        method: 'PATCH',
        body: JSON.stringify({
          id: resolvingComplaint.id,
          status: 'waiting_confirmation'
        }),
      });

      toast({
        title: 'Success',
        description: 'Complaint marked as resolved. Awaiting warden confirmation.',
      });
      fetchWorkerAndComplaints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update complaint status.',
        variant: 'destructive',
      });
    }

    setResolveLoading(false);
    setResolveDialogOpen(false);
  };

  // Calculate stats
  const ongoingCount = complaints.filter((c) => c.status === 'in_progress').length;
  const waitingCount = complaints.filter((c) => c.status === 'waiting_confirmation').length;
  const completedCount = complaints.filter((c) => c.status === 'resolved').length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Worker Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your assigned tasks
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total Assigned"
            value={complaints.length}
            icon={ClipboardList}
          />
          <StatsCard
            title="Ongoing"
            value={ongoingCount}
            icon={Clock}
            variant="in-progress"
          />
          <StatsCard
            title="Awaiting Confirmation"
            value={waitingCount}
            icon={AlertCircle}
            variant="pending"
          />
        </div>

        {/* Active Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Assigned Tasks</h2>

          {complaints.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No tasks assigned</h3>
              <p className="text-muted-foreground text-sm">
                You'll see assigned complaints here when the warden assigns them to you.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  showLocation
                  onClick={complaint.status === 'in_progress' ? handleComplaintClick : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mark Resolved Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Completed</DialogTitle>
            <DialogDescription>
              Confirm that you have completed this task. The warden will review and confirm the resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">{resolvingComplaint?.title}</h4>
              <p className="text-sm text-muted-foreground">{resolvingComplaint?.description}</p>
              {resolvingComplaint?.hostel_name && (
                <p className="text-xs text-muted-foreground">
                  Location: {[resolvingComplaint.hostel_name, resolvingComplaint.block, resolvingComplaint.floor, resolvingComplaint.room_number].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkResolved} disabled={resolveLoading}>
              {resolveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
