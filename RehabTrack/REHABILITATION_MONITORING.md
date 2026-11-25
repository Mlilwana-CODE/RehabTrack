# Before/After rehabilitation monitoring

## Migration and storage
Run `RehabTrack/supabase/migrations/006_rehabilitation_monitoring.sql` in the SQL Editor for the same Supabase project as the app. It creates `rehabilitation_images`, `rehabilitation_timelines`, `rehabilitation_observations`, a private Storage bucket with a 200 MiB limit, and RLS policies. New profile roles default to `viewer`; admins must grant upload privileges by updating the role for an existing profile, for example:

```sql
update public.profiles set role = 'inspector' where id = 'AUTH_USER_UUID';
-- Or grant admin:
update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
```

Keep the UUID restricted to your authorized user. This app's existing data model is per-account, so records are private to their owner; project admins can manage/read all monitoring records. Inspectors can upload and manage their own evidence. Viewers can view their account's evidence and reports. The SQL grants default viewers no write policies. Organization-wide cross-user access is not available because the current profiles schema does not define organization membership.

## Routes and capabilities
- `/before-after` — gallery, filters, before/after slider, chronology, evidence metadata, upload queue, scores, milestones, observations, print/PDF export.
- `GET /api/rehabilitation/images` — authenticated, RLS-filtered image metadata plus one-hour signed URLs; accepts `siteId`, `stage`, `type`, `from`, and `to` query filters.
- `POST /api/rehabilitation/analyze` — authenticated optional OpenAI vision analysis saved as an observation. Needs `OPENAI_API_KEY`; without it, uploads, manual field scores, comparisons, timeline, and exports continue to work.
- Storage is private. Direct browser uploads require the user's authenticated Supabase session and uploader role; signed URLs expire after one hour.

## Deployment
1. Apply migration 006 in Supabase SQL Editor.
2. Assign `inspector`/`admin` roles through a trusted administrator SQL session; all users otherwise stay viewer-only.
3. Deploy the latest application commit to Vercel. No new environment variable is needed for base monitoring.
4. Optional: configure server-only `OPENAI_API_KEY` and `OPENAI_MODEL` for image observations. AI analysis will not work without the key.
5. Open `/before-after`; add images with geolocation permission enabled. Mobile camera capture uses the device browser's capture control. Offline uploads are held in browser IndexedDB and sync when the app is open and network returns; don't clear site data before synchronization.

## Image analysis and metrics
AI vision requires a configured OpenAI API key and should be treated as a qualitative screening observation, not an engineering survey or exact satellite vegetation calculation. Manual scores entered during upload are available without paid AI. The progress widget averages available scores from the latest observation; it displays no percentage until measurements exist. No Sentinel-2/Landsat API integration is configured; satellite imagery can be uploaded and tagged as satellite source. Drone flight date and arbitrary survey metadata are stored with the image.

## Testing checklist
- [ ] Apply migration; confirm all three tables, private bucket, and RLS policies exist.
- [ ] Confirm viewer can see own gallery but cannot upload/insert/delete.
- [ ] Promote test user to inspector; upload field, drone, and satellite files and verify metadata, GPS, and signed image preview.
- [ ] Verify non-owner account cannot view records/storage; verify admin can read/manage records.
- [ ] Compare before/current image pair with slider on desktop and mobile.
- [ ] Filter site, date, stage, and image type; verify chronology and milestone insert.
- [ ] Disable network, queue an upload, restore network, and verify synchronization while the page is open.
- [ ] Test AI observation with key configured and without key; missing key should display a clear non-destructive message.
- [ ] Export/print a report and save as PDF; verify image previews load.
- [ ] Verify dashboard widget updates for recent uploads and entered progress scores.
- [ ] Run `npm run typecheck` and `npm run build` in `RehabTrack/`.
