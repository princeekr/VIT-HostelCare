import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { StatsCard } from '@/components/StatsCard';
import { ComplaintCard } from '@/components/ComplaintCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Complaint } from '@/types/database';
import { FileText, Clock, Loader2, CheckCircle2, AlertTriangle, ArrowRight, AlertCircle, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workersCount, setWorkersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintsData, workersData] = await Promise.all([
          apiFetch('/api/complaints'),
          apiFetch('/api/workers'),
        ]);

        setComplaints(complaintsData);
        setWorkersCount(workersData.length);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('admin-complaints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    waitingConfirmation: complaints.filter((c) => c.status === 'waiting_confirmation').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    highPriority: complaints.filter((c) => c.priority === 'high' && c.status !== 'resolved').length,
  };

  const actionRequired = complaints
    .filter((c) => c.status === 'pending' || c.status === 'waiting_confirmation')
    .slice(0, 5);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Warden Dashboard</h1>
            <p className="text-muted-foreground">Overview of all hostel complaints</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/workers">
                <Users className="h-4 w-4 mr-2" />
                Workers ({workersCount})
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/complaints">
                View All Complaints
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatsCard title="Total" value={stats.total} icon={FileText} />
          <StatsCard title="Pending" value={stats.pending} icon={Clock} variant="pending" />
          <StatsCard title="Ongoing" value={stats.inProgress} icon={Loader2} variant="in-progress" />
          <StatsCard
            title="Awaiting Review"
            value={stats.waitingConfirmation}
            icon={AlertCircle}
            className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          />
          <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle2} variant="resolved" />
          <StatsCard
            title="High Priority"
            value={stats.highPriority}
            icon={AlertTriangle}
            className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          />
        </div>

        {/* Action Required */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Action Required</h2>
            {(stats.pending + stats.waitingConfirmation) > 5 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/complaints?status=pending">View All</Link>
              </Button>
            )}
          </div>

          {actionRequired.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-resolved))] mx-auto mb-4" />
              <h3 className="font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground text-sm">No pending actions at the moment</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {actionRequired.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} showLocation onClick={() => { }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
