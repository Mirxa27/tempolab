# HabibStay

Production-ready React + TypeScript + Vite app with Supabase backend, admin panel, and mobile-first UI.

## Getting Started

1. Copy `.env.example` to `.env` and set values:

```
VITE_API_BASE_URL= https://your-api.example.com
VITE_SUPABASE_URL= https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY= your_anon_key
```

2. Install dependencies:

```
npm install
```

3. Run database migrations and seed using Supabase SQL editor or CLI:

- Run the SQL in `supabase/migrations/0001_init.sql`
- Run the SQL in `supabase/migrations/0002_admin_policies.sql`
- Run the SQL in `supabase/seed/0001_seed.sql`

4. Start the dev server:

```
npm run dev
```

## Admin Bootstrap

- Sign in with email OTP from the globe menu
- Click “Grant Self Admin” once to become the initial super admin
- Use the Admin panel (`/admin`) to manage properties, configuration, and roles

## Deployment (Vercel)

- Set env vars in Vercel Project Settings: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Use the default Vite build command `npm run build` and output `dist`

