import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { StatsCard } from '@/components/StatsCard';
import { ComplaintCard } from '@/components/ComplaintCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Complaint } from '@/types/database';
import { FileText, Clock, Loader2, CheckCircle2, PlusCircle, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchComplaints = async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComplaints(data as Complaint[]);
      }
      setLoading(false);
    };

    fetchComplaints();

    const channel = supabase
      .channel('complaints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `user_id=eq.${user.id}` }, () => fetchComplaints())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    ongoing: complaints.filter((c) => c.status === 'in_progress' || c.status === 'waiting_confirmation').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  const recentComplaints = complaints.slice(0, 3);

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
            <h1 className="text-2xl lg:text-3xl font-bold">
              Hello, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-muted-foreground">Track your hostel complaints and their status</p>
          </div>
          <Button asChild size="lg">
            <Link href="/new-complaint">
              <PlusCircle className="h-5 w-5 mr-2" />
              Raise Complaint
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Complaints" value={stats.total} icon={FileText} />
          <StatsCard title="Pending" value={stats.pending} icon={Clock} variant="pending" />
          <StatsCard title="Ongoing" value={stats.ongoing} icon={Loader2} variant="in-progress" />
          <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle2} variant="resolved" />
        </div>

        {/* Recent Complaints */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Complaints</h2>
            {complaints.length > 3 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/my-complaints">View All ({complaints.length})</Link>
              </Button>
            )}
          </div>

          {recentComplaints.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No complaints yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Raise your first complaint to get started</p>
              <Button asChild>
                <Link href="/new-complaint">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Raise Complaint
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {recentComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
