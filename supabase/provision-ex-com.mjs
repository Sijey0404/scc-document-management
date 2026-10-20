import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.EX_COM_EMAIL || "edward@scc.edu.ph";
const name = process.env.EX_COM_NAME || "Edward Vincent D. Unson";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before provisioning.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
  data: { name, is_admin: true, position: "EX_COM" },
});

if (error) throw error;
if (!data.user) throw new Error("Supabase did not return the invited user.");

const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: data.user.id,
    name,
    email,
    role: true,
    department_id: null,
    position: "EX_COM",
    password_change_required: false,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "id" },
);

if (profileError) {
  throw new Error(`The invitation was sent, but the ex-com profile could not be saved: ${profileError.message}`);
}

console.log(`Ex-com invitation sent to ${email}.`);
