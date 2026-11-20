import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | undefined;
export function getSupabaseBrowserClient() {
 const url=import.meta.env.VITE_SUPABASE_URL;
 const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Configuração pública Supabase ausente.');
 if(!key.startsWith('sb_publishable_'))throw new Error('Este cliente exige uma chave pública Supabase.');
 return client??=createClient(url,key);
}
// Existing app authentication stays behind /api/auth and is backed by Postgres.
// Do not mix Supabase Auth sessions with the app's existing pg_auth_token.
