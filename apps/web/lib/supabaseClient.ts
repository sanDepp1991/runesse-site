"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  // eslint-disable-next-line no-var
  var __runesse_supabase__: ReturnType<typeof createClient> | undefined;
}

export const supabase =
  globalThis.__runesse_supabase__ ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });

if (!globalThis.__runesse_supabase__) {
  globalThis.__runesse_supabase__ = supabase;
}
