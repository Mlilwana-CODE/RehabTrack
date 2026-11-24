# LAUNCH CHECKLIST

1. Run `supabase/migrations/001_rehabtrack_launch.sql` in the RehabTrack Supabase SQL Editor.
2. Add the exact Netlify variables in `.env.example`.
3. Use the `sb_publishable_...` key, never `sb_secret_...`.
4. Configure the Netlify production URL in Supabase Authentication > URL Configuration.
5. Deploy without cache.
6. Test registration, email confirmation, login, logout, site creation, assessment creation, rehabilitation action creation, report printing, and AI fallback.
7. Add `OPENAI_API_KEY` only when ready to activate model responses.
