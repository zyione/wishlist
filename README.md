# Wishfully

A personal wishlist website with two editable lists, mist-blue and soft-rose accents, optional collapsible sections, multiple shop links, descriptions, images, favorites, and obtained status.

## Run locally

Requires Node.js 22.13 or newer. No dependency installation is needed.

```powershell
npm start
```

Open http://127.0.0.1:4173. The server binds to this computer only by default. Keep it running while using the website. Data is saved in `data/wishfully.sqlite`; uploaded images are saved in `data/images/`. Neither is committed. Keep both when backing up the server, or use **Settings → Export backup** in the app for a portable copy containing both lists and images.

On Windows, you can also double-click `Start-Wishfully.cmd` instead of opening a terminal yourself.

`PORT` changes the listening port; `WISHFULLY_DATA_DIR` changes the data directory. Set `HOST` only when intentionally exposing the server on your network. The local server does not provide sign-in and should not be exposed to the public internet.

## Features

- Rename either wishlist and switch its accent independently.
- Add, rename, reorder, collapse, and remove optional sections. Removing a section preserves its wishes.
- Add/edit/delete wishes, upload a photo or use an image URL, add and reorder up to 30 shop links with optional PHP prices and variant notes.
- Search names, descriptions, and shops; filter favorites or obtained wishes; sort by date, name, or price.
- Optimistic version checks prevent one browser tab from silently overwriting another.
- Export and restore JSON backups, including uploaded images.
- Responsive layouts, keyboard-accessible dialogs, reduced motion, stronger contrast, and optional light, dark, or device appearance.

The initial wishes are editable examples. Their prices and shop homepages are examples, not verified product listings. Sample product photos are served from retailer image URLs (DataVision, Oxford Street, Analog Watch Co., Mega.tn, Wehkamp, Shamy Stores, and Idealo), with bundled SVG illustrations as offline fallbacks. Your uploaded images and personal image URLs are unchanged.

## Checks

```powershell
npm test
npm run build
```

The default build creates `vercel-public/` for Vercel. The `api/` functions store account-specific wishes and private images in Supabase. See [DEPLOYMENT.md](DEPLOYMENT.md) for the migration, environment variables, and email sign-in setup. Use export/import to transfer existing local wishes into your signed-in cloud account. An optional legacy Worker build remains available through `npm run build:worker`.

Vercel/Supabase deployment is prepared but not yet live: project creation needs a database password entered by the owner, and the command environment cannot currently resolve GitHub for the initial push. Chrome desktop visual verification was completed for both accents, item details, and appearance controls after correcting the mixed light/dark appearance. Automated checks cover the data model and local server API.

## Design

Uses the installed `apple-design` guidance: content-first typography, restrained blue/rose accents, solid content surfaces, frosted navigation, generous spacing, clear focus indicators, and progressive disclosure. Web materials approximate the native Apple appearance.

Typography uses the bundled Inter Latin variable font from Google Fonts, licensed under the SIL Open Font License in `public/assets/Inter-OFL.txt`. Light is the default appearance; Settings lets each device choose dark or follow its system setting.

Responsive layout checks were also completed in the integrated browser for a 320px phone and tablet portrait/landscape sizes. The phone editor and multi-link form fit without horizontal overflow. Touch controls have 44px targets, mobile text fields use 16px type, and safe-area padding is included. These are browser layout simulations, not tests on physical iOS/iPadOS hardware.
