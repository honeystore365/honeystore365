# Firebase Studio

A Next.js e-commerce platform for honey and related products, using Supabase as a backend.

To get started, take a look at src/app/page.tsx.

## Environment Variables for Deployment
The following environment variables are required for deploying to Vercel (and for local development):
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase project (if admin actions are performed server-side).

Ensure these are set in your Vercel project settings.
