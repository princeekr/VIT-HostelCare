import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ComplaintCard } from '@/components/ComplaintCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority, Worker, Profile } from '@/types/database';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS, STAFF_LABELS } from '@/types/database';
import { Loader2, Filter, Search, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface WorkerWithProfile extends Worker {
  profile?: Profile;
}

export default function AdminComplaints() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<WorkerWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>(
    (searchParams.get('status') as ComplaintStatus) || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editStatus, setEditStatus] = useState<ComplaintStatus>('pending');
  const [editPriority, setEditPriority] = useState<ComplaintPriority>('medium');
  const [editAssignedWorkerId, setEditAssignedWorkerId] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      let url = '/api/complaints?';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (categoryFilter !== 'all') url += `&category=${categoryFilter}`;
      if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;

      let filtered = await apiFetch(url);

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (c: Complaint) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.hostel_name?.toLowerCase().includes(q) ||
            c.block?.toLowerCase().includes(q) ||
            c.room_number?.toLowerCase().includes(q)
        );
      }

      setComplaints(filtered);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    }
    setLoading(false);
  };

  const fetchWorkers = async () => {
    try {
      const workersWithProfiles = await apiFetch('/api/workers');
      setWorkers(workersWithProfiles);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchWorkers();
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-all-complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetchComplaints())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleComplaintClick = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditStatus(complaint.status);
    setEditPriority(complaint.priority);
    setEditAssignedWorkerId(complaint.assigned_worker_id || '');
    setEditAdminNotes(complaint.admin_notes || '');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingComplaint) return;
    setEditLoading(true);

    // Auto-set status to in_progress when assigning a worker
    let newStatus = editStatus;
    if (editAssignedWorkerId && editingComplaint.status === 'pending') {
      newStatus = 'in_progress';
    }

    try {
      await apiFetch('/api/complaints', {
        method: 'PATCH',
        body: JSON.stringify({
          id: editingComplaint.id,
          status: newStatus,
          priority: editPriority,
          assigned_worker_id: editAssignedWorkerId || null,
          admin_notes: editAdminNotes || null,
        }),
      });

      toast({ title: 'Success', description: 'Complaint updated successfully.' });
      fetchComplaints();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update complaint.', variant: 'destructive' });
    }

    setEditLoading(false);
    setEditDialogOpen(false);
  };

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">All Complaints</h1>
          <p className="text-muted-foreground">Manage and update complaint status</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ComplaintStatus | 'all')}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {(Object.keys(STATUS_LABELS) as ComplaintStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ComplaintCategory | 'all')}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as ComplaintPriority | 'all')}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {(Object.keys(PRIORITY_LABELS) as ComplaintPriority[]).map((priority) => (
                  <SelectItem key={priority} value={priority}>{PRIORITY_LABELS[priority]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No complaints found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} showLocation onClick={handleComplaintClick} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
            <DialogDescription>{editingComplaint?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ComplaintStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ComplaintStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as ComplaintPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABELS) as ComplaintPriority[]).map((priority) => (
                      <SelectItem key={priority} value={priority}>{PRIORITY_LABELS[priority]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign Worker</Label>
              <Select value={editAssignedWorkerId || 'unassigned'} onValueChange={(v) => setEditAssignedWorkerId(v === 'unassigned' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select a worker" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.profile?.full_name || 'Unknown'} ({STAFF_LABELS[worker.worker_type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Assigning a worker will set status to Ongoing</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea id="admin-notes" placeholder="Add notes..." value={editAdminNotes} onChange={(e) => setEditAdminNotes(e.target.value)} rows={3} />
            </div>
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium">Complaint Details</p>
              <p className="text-sm text-muted-foreground">{editingComplaint?.description}</p>
              {editingComplaint?.hostel_name && (
                <p className="text-xs text-muted-foreground">
                  Location: {[editingComplaint.hostel_name, editingComplaint.block, editingComplaint.floor, editingComplaint.room_number].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
