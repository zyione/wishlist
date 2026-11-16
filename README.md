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

The build produces a Cloudflare Worker module with embedded frontend assets. The hosted adapter expects D1 binding `DB`, R2 binding `BUCKET`, the SQL migration in `migrations/`, and owner-private hosting access. The local SQLite database and hosted D1 database are separate. Use export/import to transfer wishes.

Hosting has not been completed: the environment could not resolve the hosting source server. The Worker adapter is prepared for future integration, but its hosted bindings and migration setup still require validation before deployment. Chrome desktop visual verification was completed for both accents, item details, and appearance controls after correcting the mixed light/dark appearance. Automated checks cover the data model and local server API.

## Design

Uses the installed `apple-design` guidance: content-first typography, restrained blue/rose accents, solid content surfaces, frosted navigation, generous spacing, clear focus indicators, and progressive disclosure. Web materials approximate the native Apple appearance.

Typography uses the bundled Inter Latin variable font from Google Fonts, licensed under the SIL Open Font License in `public/assets/Inter-OFL.txt`. Light is the default appearance; Settings lets each device choose dark or follow its system setting.

Responsive layout checks were also completed in the integrated browser for a 320px phone and tablet portrait/landscape sizes. The phone editor and multi-link form fit without horizontal overflow. Touch controls have 44px targets, mobile text fields use 16px type, and safe-area padding is included. These are browser layout simulations, not tests on physical iOS/iPadOS hardware.
