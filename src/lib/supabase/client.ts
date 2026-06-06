import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabaseBrowserClient = {
  get auth() {
    return getSupabaseBrowserClient().auth;
  },
  from(table: string) {
    return getSupabaseBrowserClient().from(table);
  },
};
