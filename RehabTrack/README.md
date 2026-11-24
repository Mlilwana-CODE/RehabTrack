# RehabTrack launch package

## Deploy
1. In Supabase SQL Editor, run `supabase/migrations/001_rehabtrack_launch.sql`.
2. In Netlify environment variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL=https://myxxwyxbqsquzbujfbay.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...`
   - Optional: `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-4o-mini`
3. Upload this project to GitHub and connect the repository to Netlify.
4. Trigger **Deploy without cache**.
5. In Supabase Authentication URL Configuration, set the Site URL to the Netlify production URL and add `https://YOUR-SITE.netlify.app/**` as a redirect URL.

Never place an `sb_secret_...` key in a `NEXT_PUBLIC_` variable.
