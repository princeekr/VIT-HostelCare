import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerClient(token);

    // Replicating logic from AdminWorkers.tsx fetchWorkers
    // 1. Fetch workers
    // 2. Fetch profiles for them
    // Or just fetch workers? The original code did a join manually.
    // The backend responsibility says "Creating specific APIs...".
    // I should provide the joined data if possible, or just the raw data.
    // AdminWorkers.tsx fetches both.
    // I'll return workers first. If frontend needs profiles, it can fetch profiles API or I join here.
    // Joining here is better for "Backend Layer".

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    let query = supabase.from('workers').select('*').order('created_at', { ascending: false });
    if (user_id) query = query.eq('user_id', user_id);

    const { data: workersData, error: workersError } = await query;

    if (workersError) {
        return NextResponse.json({ error: workersError.message }, { status: 500 });
    }

    if (!workersData || workersData.length === 0) {
        return NextResponse.json([]);
    }

    const workerIds = workersData.map((w: any) => w.user_id);
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', workerIds);

    if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const workersWithProfiles = workersData.map((worker: any) => ({
        ...worker,
        profile: profilesData?.find((p: any) => p.user_id === worker.user_id),
    }));

    return NextResponse.json(workersWithProfiles);
}
