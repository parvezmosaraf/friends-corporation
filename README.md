# Payroll Pal | Friends Corporation

Payroll and salary management for Friends Corporation — manage salaries across your shops.

## Getting started

**Requirements:** Node.js and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd payroll-pal

# Install dependencies
npm i

# Start the development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Default admin login

The app uses username-only auth. The default admin is set in the database via `supabase/migrations/20260202000000_admin_users_username_auth.sql`.

- **Username:** `friendscorporation`
- **Password:** `AsdAsd777@#`

Run the Supabase migrations so the `admin_users` table and preset admin exist. The login form is pre-filled with these defaults.

## PWA (Progressive Web App)

Payroll Pal is a PWA with its own icon and manifest:

- **Install** on phone or desktop (Add to Home Screen / Install app).
- **Offline** — app shell and cached data work without network.
- **Auto-update** — new versions prompt to reload.

The app icon (৳ on navy gradient) is in `public/icon.svg`. PNG icons (192×192 and 512×512) are generated for the PWA install prompt via `npm run generate-pwa-icons` (runs automatically before `npm run build`). For the **install icon** to appear in the browser, use the **production** build: run `npm run build` then `npm run preview`, and open the preview URL (e.g. http://localhost:4173). Chrome requires PNG icons and a registered service worker, which are only active in the built app.

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase
- PWA (vite-plugin-pwa)

## Deploy

Build for production:

```sh
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, etc.). Serve over HTTPS for full PWA install support.
