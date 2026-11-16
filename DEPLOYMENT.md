# Vercel + Supabase deployment

Source repository: https://github.com/zyione/wishlist

## 1. Supabase

Create a dedicated free project named `wishfully` in your existing organization. Choose a nearby region (Singapore is appropriate for the Philippines). Set the database password yourself; the application never needs that password.

In the project's SQL Editor:
- If this is a new setup, run the complete file: `supabase/migrations/202611160001_wishfully.sql`
- If you previously ran the earlier migration, run: `supabase/migrations/202611160002_shared_wishlist.sql`

This creates the shared Wishfully table (`wishfully_state`), configures public image storage (`wishfully-images`), and allows both lists ("His wishlist" and "Her wishlist") to sync seamlessly between the two of you without email login.

From the project's API settings, obtain the project URL and public publishable key (or legacy `anon` key).

## 2. GitHub

Push this project to `zyione/wishlist`. The ignored `data/`, `.qa/`, `.env*` (except `.env.example`), `.git/`, and generated build folders must not be uploaded.

You can double-click `Publish-GitHub.cmd` in the project folder to commit and push using your normal Git environment.

## 3. Vercel

Import `zyione/wishlist` into the existing personal Vercel team.

- Framework preset: **Other**
- Root directory: repository root
- Build command: provided by `vercel.json` (`node scripts/build-vercel.mjs`)
- Output directory: `vercel-public`
- Install command: default
- Environment variables for production and preview:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`)

The `api/` functions run on Vercel and store wishes in Supabase.

## 4. Shared access (No email sign-in needed)

Email login is disabled. The website directly loads and displays the two wishlists:
- **His wishlist** (mist-blue theme)
- **Her wishlist** (soft-rose theme)

Both users can open the deployed URL on phones, tablets, or computers to view, switch between, add, and edit wishes without entering an email or waiting for magic links.

## 5. Move local wishes

If you have wishes saved locally, use **Settings → Export backup** in the local app, open the deployed app, and use **Settings → Import backup**. Both lists and uploaded images will transfer over.

## Verification

Run `node --test tests/*.test.mjs` and `node scripts/build-vercel.mjs`. Verify opening the page without sign-in, switching between His and Her wishlists, adding/editing a wish, uploading an image, and persistence across reloads.
