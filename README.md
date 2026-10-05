# Staff Availability Poll

A polished monthly availability calendar for staff scheduling. Staff can move month-to-month, click any day, choose a time in a pop-up modal, type their name, and save their availability.

## Features

- Password-protected access
- Apple/Google-style monthly calendar view
- Month-to-month navigation
- Day selection with a modal-based time chooser
- 24-hour slot selection for each day
- Per-person color badges for easier visual differentiation
- Supabase-backed persistence for staff entries

## Local setup

1. Install dependencies:

   npm install

2. Copy the example environment file:

   cp .env.example .env.local

3. Fill in your Supabase credentials and poll password in .env.local.

4. Run the app locally:

   npm run dev -- --host 0.0.0.0

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run the contents of supabase/schema.sql.
3. Copy the project URL and anon key into your environment.

## Netlify deployment

1. Connect the repo to Netlify.
2. Set the build command to `npm run build`.
3. Set the publish directory to `dist`.
4. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_POLL_PASSWORD`
5. Deploy the site.

## Notes

This prototype uses the public Supabase anon key for a no-account staff poll. For stricter production controls, add server-side auth and tighter row-level security rules.
