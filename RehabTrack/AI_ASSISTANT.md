# AI Rehabilitation Assistant

## Included
- Responsive ChatGPT-style assistant with conversation sidebar, new chat, stored history, site scoping, streaming output, and delete conversation controls.
- Authenticated server routes for OpenAI chat streaming, conversation listing/deletion, message loading, site options, and AI insights.
- Dashboard insight card that generates and stores evidence-based insight summaries.
- Site map popup link to launch a site-scoped assistant analysis (see map integration change).

## Database migration
Run `RehabTrack/supabase/migrations/005_ai_assistant.sql` in the SQL Editor for the exact Supabase project used by the deployment. It creates/extends `ai_conversations`, and creates `ai_messages` and `ai_insights`; enables owner-scoped RLS; denies anonymous access; and adds indexes. Existing `ai_conversations.messages` JSON is retained for compatibility; new history is stored in `ai_messages`.

## Environment variables
Configure in Vercel for Production, Preview, and Development as appropriate:
- `OPENAI_API_KEY` — secret server-side key; never prefix with `NEXT_PUBLIC_`.
- `OPENAI_MODEL` — optional, defaults to `gpt-4o-mini`.
- Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must point to the same Supabase project where the migration is applied.

## Security and limits
Every API route validates the current Supabase user. Data queries use the user's Supabase session and RLS. Conversation/message/insight records are owner-scoped; no service-role key is used. Chat limit: 12 user messages per authenticated user per minute; dashboard insight generation limit: 3 per minute. OpenAI requests only run server-side. The current app has no role/permission model beyond authenticated account ownership, so regulator/consultant role-specific permissions require adding roles to profiles and defining policy rules before production deployment.

## Deployment
1. Apply `005_ai_assistant.sql` in the Supabase SQL Editor.
2. Add `OPENAI_API_KEY` and optional `OPENAI_MODEL` in Vercel Project Settings → Environment Variables. Keep the key server-only.
3. Deploy the latest `main` commit; redeploy after changing variables.
4. Check `/ai-assistant`, start a conversation, use each one-click action, refresh to verify history, and check dashboard insights.
5. For site map integration, each marker popup should include a link to `/ai-assistant?siteId=<site-id>&prompt=Analyze%20this%20rehabilitation%20zone.`

## API routes
- `POST /api/ai`: authenticated, site-context retrieval, rate limit, OpenAI streaming, persistent user/assistant messages.
- `GET/DELETE /api/ai/conversations`: list owned conversations / delete one owned conversation.
- `GET /api/ai/messages?conversationId=...`: read messages from an owned conversation.
- `GET /api/ai/sites`: owned site selector options.
- `GET/POST /api/ai/insights`: get live stored insights / generate, validate, and persist AI insight records.

## Test checklist
- [ ] Migration executes successfully; verify RLS is enabled on all three AI tables.
- [ ] Missing `OPENAI_API_KEY` returns a readable configuration error, not a crash.
- [ ] Signed-out API requests return 401.
- [ ] Chat streams incrementally and records both user and assistant messages.
- [ ] Refresh restores the conversation and messages; a second user cannot read/delete another user's conversation.
- [ ] Test prompts for highest risk, overdue actions, site summary, compliance review, recommendations, and a draft report; confirm absent data is called out instead of fabricated.
- [ ] Request limit returns 429 and a retry message.
- [ ] Dashboard generates, persists, and displays insights without claiming unsupported trends.
- [ ] Add a map-popup site analysis link and verify site scoping.
- [ ] Print a generated report to PDF via browser print; verify CSV/PDF content before external use.
- [ ] Run `npm run typecheck` and `npm run build` in `RehabTrack/`.
