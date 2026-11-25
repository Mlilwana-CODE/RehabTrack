# Report persistence fix

Reports are stored in the `public.reports` table in Supabase; they are not browser-local drafts. Apply `supabase/migrations/004_reports_persistence_rls.sql` to the same Supabase project used by the deployed app. It sets authenticated ownership defaults, backfills ownership from linked sites, enables owner-only RLS access, and grants the authenticated role required table permissions.

After applying it, sign in with the same account that owns the site, create a report, refresh `/reports`, and confirm the report remains in history. If the report still disappears, verify that Vercel's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` point to that same Supabase project. Existing reports that are not linked to a site cannot be safely assigned to an owner by this migration.
