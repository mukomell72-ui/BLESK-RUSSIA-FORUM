# BLEZZ RUSSIA — live forum application

Production-oriented Next.js + Supabase forum in `forum-app/`. This app uses isolated `blezz_forum_*` tables and Supabase Auth with PostgreSQL RLS. It does **not** claim every requested feature is complete.

## Deploy
Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel, choose root directory `forum-app`. Schema is installed in the linked Supabase project; no secrets are checked in. Registered verified owner can use Claim owner. Public homepage /, protected /admin.

## Implemented
Auth with email confirmation/reset; profiles; roles/permission RPC; servers/categories; threads/replies/reactions/subscriptions; case management; message inbox; news; client-managed customisable seasonal effects and schedule; theme history; audit entries; uploads to public image bucket (authenticated subfolders).

## Known gaps
Moderation 2FA enforcement, backup restore UI, full WYSIWYG embeds, automated CI e2e, push notifications, comprehensive rate limiting, anti-malware scanning and online-user presence require additional work and verification. Avoid marketing site as fully production hardened until penetration testing.
