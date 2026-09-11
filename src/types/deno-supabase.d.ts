/** Frontend test typechecking only; Deno resolves its pinned npm import at runtime. */
declare module "npm:@supabase/supabase-js@2.53.1" {
  export type { SupabaseClient } from "@supabase/supabase-js";
}
