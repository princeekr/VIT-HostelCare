import { createClient } from '@supabase/supabase-js';

export const createServerClient = (accessToken: string) => {
    return createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        }
    );
};
