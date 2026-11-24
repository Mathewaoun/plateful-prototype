// Plateful – backend connection (Supabase: Postgres database + user accounts).
// These two values are designed to be public: row-level security in supabase/schema.sql keeps each user's data private.
// Never put the service_role / secret key here.
window.PLATEFUL_CONFIG={
  supabaseUrl:"https://ngfzsdoxecwtgursmozy.supabase.co",
  supabaseKey:"sb_publishable_pJVIwQvDyVlpVfhn65F5cA_oHvXG3kt"
};
