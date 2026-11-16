# Vercel + Supabase deployment

Source repository: https://github.com/zyione/wishlist

## 1. Supabase

Create a dedicated free project named `wishfully` in your existing organization. Choose a nearby region (Singapore is appropriate for the Philippines). Set the database password yourself; the application never needs that password.

In the new project's SQL Editor, run the complete file:

`supabase/migrations/202611160001_wishfully.sql`

This creates only the Wishfully table, a private image bucket, and policies that restrict every account to its own rows and images. It does not modify your other projects. Run this migration once.

From the project's API settings, obtain the project URL and public publishable key (or legacy `anon` key). No secret/service-role key is needed.

## 2. GitHub

Push this project to `zyione/wishlist`. The ignored `data/`, `.qa/`, `.env*` (except `.env.example`), `.git/`, and generated build folders must not be uploaded. The unrelated `.openai/` hosting identity is excluded from the Vercel upload package.

In this local environment, both Git index writes and terminal network access were denied despite the app's Full access setting. You can double-click `Publish-GitHub.cmd` in the project folder to make the initial commit and push using your own normal Git environment. It uploads only the listed source paths and never force-pushes. If the remote already has a conflicting history, it stops and reports the error instead of overwriting it.

## 3. Vercel

Import `zyione/wishlist` into the existing personal Vercel team.

- Framework preset: **Other**
- Root directory: repository root
- Build command: provided by `vercel.json` (`node scripts/build-vercel.mjs`)
- Output directory: `vercel-public`
- Install command: default
- Environment variables for production and preview:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY` for a legacy anon key)

The `api/` functions run on Vercel and use Supabase's REST and Storage endpoints with each signed-in user's token. No local SQLite files are used in production.

## 4. Sign-in redirect

After the production URL is available, set Supabase Auth's **Site URL** to that exact HTTPS URL and add the same URL to **Redirect URLs**. If you want to sign in on a preview deployment, add that preview URL separately.

The app sends a sign-in link only when you submit its email form. Once you open that link, tokens are moved into HttpOnly, Secure, SameSite=Lax cookies and removed from the address bar. Refresh tokens are kept out of frontend storage. Each account gets its own two wishlists.

## 5. Move local wishes

Export a backup from the local app, sign in to the deployed app, and import that backup. This also transfers uploaded images. Keep the local backup until you verify the deployed lists and photos.

## Verification

Run `npm test` and `node scripts/build-vercel.mjs`. Then verify the production sign-in, adding/editing a wish, multiple links, sections, an image upload, and persistence after reloading. Check the page on phone and tablet widths.

At preparation time, the command environment could not resolve GitHub. Vercel and Supabase were signed in through Chrome, and Vercel could see the `zyione/wishlist` repository. No GitHub authentication failure was observed.
