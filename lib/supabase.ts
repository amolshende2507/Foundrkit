import { createBrowserClient } from '@supabase/ssr';

// We use createBrowserClient because it automatically handles
// moving the session into cookies so the Middleware can read it.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);