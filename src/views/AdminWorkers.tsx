import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Worker, StaffType, Profile } from '@/types/database';
import { STAFF_LABELS } from '@/types/database';
import { Loader2, Plus, Wrench, Trash2, UserCheck, UserX, Search, Phone, Mail, Calendar, User } from 'lucide-react';

interface WorkerWithProfile extends Worker {
  profile?: Profile;
}

export default function AdminWorkers() {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<WorkerWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerType, setNewWorkerType] = useState<StaffType>('technician');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingWorker, setDeletingWorker] = useState<WorkerWithProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View details dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithProfile | null>(null);

  const fetchWorkers = async () => {
    const { data: workersData, error } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && workersData) {
      // Fetch profiles for each worker
      const workerIds = workersData.map((w) => w.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', workerIds);

      const workersWithProfiles = workersData.map((worker) => ({
        ...worker,
        profile: profilesData?.find((p) => p.user_id === worker.user_id),
      })) as WorkerWithProfile[];

      setWorkers(workersWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-workers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workers' },
        () => fetchWorkers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddWorker = async () => {
    if (!newWorkerEmail || !newWorkerPassword || !newWorkerName || !newWorkerPhone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setAddLoading(true);

    try {
      // Save admin's current session BEFORE signUp changes it
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) {
        throw new Error('Admin session not found');
      }

      // Create the user account (this will change the session to the new user!)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newWorkerEmail,
        password: newWorkerPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: newWorkerName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const newUserId = authData.user.id;
        
        // Restore admin session BEFORE calling RPC functions
        const { error: restoreError } = await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
        
        if (restoreError) throw restoreError;

        // Now admin is logged in again - call the RPC functions
        // Update user role to 'worker' using secure admin function
        const { error: roleError } = await supabase
          .rpc('set_user_role', {
            _user_id: newUserId,
            _role: 'worker',
          });

        if (roleError) throw roleError;

        // Insert worker record using security definer function
        const { error: workerError } = await supabase
          .rpc('create_worker_record', {
            _user_id: newUserId,
            _worker_type: newWorkerType,
            _phone: newWorkerPhone || null,
          });

        if (workerError) throw workerError;

        // Update profile with name (using admin session which has access via RLS)
        await supabase
          .from('profiles')
          .update({ full_name: newWorkerName })
          .eq('user_id', newUserId);

        toast({
          title: 'Success',
          description: `Worker "${newWorkerName}" created successfully.`,
        });

        // Reset form
        setNewWorkerEmail('');
        setNewWorkerPassword('');
        setNewWorkerName('');
        setNewWorkerType('technician');
        setNewWorkerPhone('');
        setAddDialogOpen(false);
        fetchWorkers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create worker.',
        variant: 'destructive',
      });
      
      // If something went wrong, try to restore admin session anyway
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Session recovery failed - user may need to log in again
      }
    }

    setAddLoading(false);
  };

  const handleToggleAvailability = async (worker: WorkerWithProfile) => {
    const { error } = await supabase
      .from('workers')
      .update({ is_available: !worker.is_available })
      .eq('id', worker.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update worker availability.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Worker marked as ${!worker.is_available ? 'available' : 'unavailable'}.`,
      });
      fetchWorkers();
    }
  };

  const handleDeleteWorker = async () => {
    if (!deletingWorker) return;
    setDeleteLoading(true);

    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', deletingWorker.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete worker.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Worker removed successfully.',
      });
      fetchWorkers();
    }

    setDeleteLoading(false);
    setDeleteDialogOpen(false);
  };

  const filteredWorkers = workers.filter((worker) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      worker.profile?.full_name?.toLowerCase().includes(q) ||
      STAFF_LABELS[worker.worker_type].toLowerCase().includes(q) ||
      worker.phone?.toLowerCase().includes(q)
    );
  });

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
            <h1 className="text-2xl font-bold">Workers Management</h1>
            <p className="text-muted-foreground">
              Manage your maintenance staff
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Worker
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Workers Grid */}
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No workers found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add workers to assign them to complaints.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Worker
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkers.map((worker) => (
              <Card 
                key={worker.id} 
                className="relative cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setSelectedWorker(worker);
                  setViewDialogOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {worker.profile?.full_name || 'Unknown'}
                        </CardTitle>
                        <CardDescription>
                          {STAFF_LABELS[worker.worker_type]}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={worker.is_available ? 'default' : 'secondary'}>
                      {worker.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {worker.phone && (
                    <p className="text-sm text-muted-foreground">
                      📞 {worker.phone}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAvailability(worker);
                      }}
                    >
                      {worker.is_available ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Unavailable
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Available
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingWorker(worker);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Worker Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
            <DialogDescription>
              Create a new worker account. They'll be able to login and see assigned tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workerName">Full Name *</Label>
              <Input
                id="workerName"
                placeholder="Enter worker's name"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workerEmail">Email *</Label>
              <Input
                id="workerEmail"
                type="email"
                placeholder="worker@example.com"
                value={newWorkerEmail}
                onChange={(e) => setNewWorkerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workerPassword">Password *</Label>
              <Input
                id="workerPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newWorkerPassword}
                onChange={(e) => setNewWorkerPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Worker Type *</Label>
              <Select value={newWorkerType} onValueChange={(v) => setNewWorkerType(v as StaffType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAFF_LABELS) as StaffType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {STAFF_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workerPhone">Phone *</Label>
              <Input
                id="workerPhone"
                type="tel"
                placeholder="+91 98765 43210"
                value={newWorkerPhone}
                onChange={(e) => setNewWorkerPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWorker} disabled={addLoading}>
              {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Worker</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{deletingWorker?.profile?.full_name}"? 
              This will unassign them from all complaints.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorker} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Worker Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Worker Details</DialogTitle>
            <DialogDescription>
              View complete information about this worker.
            </DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-6 py-4">
              {/* Worker Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedWorker.profile?.full_name || 'Unknown'}
                  </h3>
                  <Badge variant={selectedWorker.is_available ? 'default' : 'secondary'}>
                    {selectedWorker.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>

              {/* Worker Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Worker Type</p>
                    <p className="font-medium">{STAFF_LABELS[selectedWorker.worker_type]}</p>
                  </div>
                </div>

                {selectedWorker.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{selectedWorker.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joined On</p>
                    <p className="font-medium">
                      {new Date(selectedWorker.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (selectedWorker) {
                  handleToggleAvailability(selectedWorker);
                  setViewDialogOpen(false);
                }
              }}
            >
              {selectedWorker?.is_available ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Mark Unavailable
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark Available
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedWorker) {
                  setDeletingWorker(selectedWorker);
                  setViewDialogOpen(false);
                  setDeleteDialogOpen(true);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
