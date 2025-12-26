# Coachware Fitness Admin MVP

Minimal admin-style fitness tool built with Next.js (App Router), Supabase, shadcn/ui, and Tailwind (monochrome, no rounded corners).

## Setup
1. Install deps: `npm install`
2. Copy env: `cp env.example .env.local` and fill Supabase keys + URL.
3. Run dev server: `npm run dev`

## Notes
- Auth: Supabase magic link.
- Data: `routine_plans` and `routine_templates` tables with owner-based RLS.
- Exercises: read-only library from local data; templates store exercises in `exercises` JSONB.


