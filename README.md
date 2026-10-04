# Staff Availability Poll

A small React app for staff to select their available one-hour time slots on a shared weekly calendar. The poll is password protected and stores its data in Supabase.

## Features

- Password gate before viewing the poll
- Weekly Monday-Friday availability grid
- One-hour slots from 8:30am to 2:00pm
- Staff names are entered manually
- Each new staff name receives a unique color for easy visual differentiation
- Supabase-backed persistence for availability selections

## Local setup

1. Install dependencies:

   npm install

2. Create a local environment file:

   cp .env.example .env.local

3. Fill in your Supabase credentials and poll password in .env.local.

4. Run the app locally:

   npm run dev

## Supabase setup

1. In Supabase, create a project.
2. Open the SQL editor and run the contents of supabase/schema.sql.
3. Make sure you copy the project URL and anon key into your environment file.

## Netlify deployment

1. Create a GitHub repo for the project:

   git init
   gh repo create nlis-staff-system --source=. --remote=origin --public --push

2. In Netlify, choose Add new site > Import an existing project and connect the GitHub repo.
3. Set the build command to:

   npm run build

4. Set the publish directory to:

   dist

5. Add environment variables in Netlify:

   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_POLL_PASSWORD

6. Deploy the site.

## Notes

This prototype uses the public Supabase anon key for a no-login staff poll. For a stricter production deployment, move the password gate server-side and tighten access rules with Supabase Row Level Security.
