import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ComplaintCategory, ComplaintPriority } from '@/types/database';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/database';
import { Loader2, ArrowLeft, Zap, Droplets, Sparkles, Wifi, Wrench, Armchair, HelpCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

import { apiFetch } from '@/lib/api';

const MAX_ACTIVE_COMPLAINTS = 2;

const categoryIcons = {
  electricity: Zap,
  water: Droplets,
  cleaning: Sparkles,
  wifi: Wifi,
  plumbing: Wrench,
  furniture: Armchair,
  other: HelpCircle,
};

const priorityIcons = {
  low: Info,
  medium: AlertCircle,
  high: AlertTriangle,
};

const priorityColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

export default function NewComplaint() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory | ''>('');
  const [priority, setPriority] = useState<ComplaintPriority | ''>('');
  const [loading, setLoading] = useState(false);
  const [activeComplaintsCount, setActiveComplaintsCount] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(true);

  useEffect(() => {
    const checkActiveComplaints = async () => {
      if (!user) return;

      const { count, error } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress']);

      if (!error && count !== null) {
        setActiveComplaintsCount(count);
      }
      setCheckingLimit(false);
    };

    checkActiveComplaints();
  }, [user]);

  const canSubmitComplaint = activeComplaintsCount < MAX_ACTIVE_COMPLAINTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || !priority) return;

    setLoading(true);

    try {
      await apiFetch('/api/complaints', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          title,
          description,
          category,
          priority,
          hostel_name: profile?.hostel_name,
          block: profile?.block,
          floor: profile?.floor,
          room_number: profile?.room_number,
        }),
      });

      toast({
        title: 'Complaint Submitted!',
        description: 'Your complaint has been registered successfully.',
      });

      router.push('/my-complaints');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit complaint. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Raise a Complaint</CardTitle>
            <CardDescription>
              Describe your issue and we'll get it resolved as soon as possible
            </CardDescription>
          </CardHeader>

          {checkingLimit ? (
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          ) : !canSubmitComplaint ? (
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have reached the maximum limit of {MAX_ACTIVE_COMPLAINTS} active complaints.
                  Please wait for your existing complaints to be resolved before raising a new one.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} disabled={loading}>
                  View My Complaints
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label>Category *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => {
                      const Icon = categoryIcons[cat];
                      const isSelected = category === cat;
                      return (
                        <Button
                          key={cat}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className="h-auto py-3 flex flex-col items-center gap-1.5"
                          onClick={() => setCategory(cat)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{CATEGORY_LABELS[cat]}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="space-y-3">
                  <Label>Priority *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PRIORITY_LABELS) as ComplaintPriority[]).map((pri) => {
                      const Icon = priorityIcons[pri];
                      const isSelected = priority === pri;
                      return (
                        <Button
                          key={pri}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className={`h-auto py-3 flex flex-col items-center gap-1.5 ${isSelected ? '' : priorityColors[pri]}`}
                          onClick={() => setPriority(pri)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{PRIORITY_LABELS[pri]}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/1000
                  </p>
                </div>

                {/* Location Info */}
                {profile && (profile.hostel_name || profile.room_number) && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {[profile.hostel_name, profile.block, profile.floor, profile.room_number]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || !category || !priority || !title || !description}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Complaint
                  </Button>
                </div>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
