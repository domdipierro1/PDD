import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Keep the client untyped for now so Vercel builds reliably while the MVP schema is still evolving.
// Page-level UI types are still used for display, but inserts/updates won't fail TypeScript builds
// if Supabase generated types differ slightly from the hand-written MVP types.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
