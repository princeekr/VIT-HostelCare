import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { ComplaintCard } from '@/components/ComplaintCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Complaint, ComplaintStatus, ComplaintCategory } from '@/types/database';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types/database';
import { Loader2, PlusCircle, Filter, AlertCircle, Zap, Droplets, Sparkles, Wifi, Wrench, Armchair, HelpCircle } from 'lucide-react';

import { apiFetch } from '@/lib/api';

const categoryIcons = {
  electricity: Zap,
  water: Droplets,
  cleaning: Sparkles,
  wifi: Wifi,
  plumbing: Wrench,
  furniture: Armchair,
  other: HelpCircle,
};

export default function MyComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | 'all'>('all');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<ComplaintCategory>('other');
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState<Complaint | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchComplaints = async () => {
    if (!user) return;

    try {
      let url = `/api/complaints?user_id=${user.id}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (categoryFilter !== 'all') url += `&category=${categoryFilter}`;

      const data = await apiFetch(url);
      setComplaints(data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, [user, statusFilter, categoryFilter]);

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditCategory(complaint.category);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingComplaint) return;
    setEditLoading(true);

    try {
      await apiFetch('/api/complaints', {
        method: 'PATCH',
        body: JSON.stringify({
          id: editingComplaint.id,
          title: editTitle,
          description: editDescription,
          category: editCategory,
        }),
      });

      toast({
        title: 'Success',
        description: 'Complaint updated successfully.',
      });
      fetchComplaints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update complaint.',
        variant: 'destructive',
      });
    }

    setEditLoading(false);
    setEditDialogOpen(false);
  };

  const handleDelete = (complaint: Complaint) => {
    setDeletingComplaint(complaint);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingComplaint) return;
    setDeleteLoading(true);

    try {
      await apiFetch(`/api/complaints?id=${deletingComplaint.id}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Deleted',
        description: 'Complaint has been deleted.',
      });
      fetchComplaints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete complaint.',
        variant: 'destructive',
      });
    }

    setDeleteLoading(false);
    setDeleteDialogOpen(false);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Complaints</h1>
            <p className="text-muted-foreground">View and manage your complaint history</p>
          </div>
          <Button asChild>
            <Link href="/new-complaint">
              <PlusCircle className="h-4 w-4 mr-2" />
              Raise Complaint
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ComplaintStatus | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.keys(STATUS_LABELS) as ComplaintStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ComplaintCategory | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No complaints found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Raise your first complaint to get started'}
            </p>
            <Button asChild>
              <Link href="/new-complaint">
                <PlusCircle className="h-4 w-4 mr-2" />
                Raise Complaint
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                showActions
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Complaint</DialogTitle>
            <DialogDescription>
              Update your complaint details. Only pending complaints can be edited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => {
                  const Icon = categoryIcons[cat];
                  const isSelected = editCategory === cat;
                  return (
                    <Button
                      key={cat}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto py-2 flex flex-col items-center gap-1"
                      onClick={() => setEditCategory(cat)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{CATEGORY_LABELS[cat]}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Complaint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this complaint? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
