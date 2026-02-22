const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const baseOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

const createSupabaseAdminClient = () =>
  createClient(env.supabaseUrl, env.supabaseServiceRoleKey, baseOptions);

const createSupabaseAnonClient = () => {
  if (!env.supabaseAnonKey) {
    throw new Error("Missing required environment variable: SUPABASE_ANON_KEY");
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, baseOptions);
};

const supabase = createSupabaseAdminClient();

module.exports = supabase;
module.exports.createSupabaseAdminClient = createSupabaseAdminClient;
module.exports.createSupabaseAnonClient = createSupabaseAnonClient;
