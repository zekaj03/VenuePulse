<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VenuePulse

This repo contains the VenuePulse web app and iOS wrapper project.

## Run Locally

Prerequisites:
- Node.js 20+
- Xcode (for iOS builds)


1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set:
   - `VITE_REVENUECAT_IOS_API_KEY`
   - `VITE_REVENUECAT_ANDROID_API_KEY` (optional until Android build)
   - `VITE_REVENUECAT_ENTITLEMENT_ID` (for example: `premium`)
3. Run the app (http://localhost:3001):
   `npm run dev`

## Server-Backed Mode (Vercel)

The app now supports shared server state via `/api/state` instead of device-only local storage.

How to enable on Vercel:
1. Add an Upstash Redis integration from Vercel Marketplace to the project.
2. In Vercel project environment variables, set:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Set client variables (Production/Preview):
   - `VITE_REMOTE_STATE_ENABLED=true`
   - `VITE_VENUE_ID=venuepulse-main` (or any venue id you want)
4. Redeploy.

Compatibility:
- The backend also accepts legacy `KV_REST_API_URL` / `KV_REST_API_TOKEN` if already configured.

Behavior:
- On app start, web clients hydrate state from `/api/state`.
- Ongoing changes are synced back to `/api/state` in small debounced patches.
- `localStorage` remains as offline cache, but server state is the shared source.

## Manager Profile and Access Control

- Workers are restricted to `Door View`.
- Manager/Admin must switch to a manager profile and unlock with PIN to access `Manager View`.
- First manager login asks to create a PIN (4-8 digits).

Default demo profiles:
- `Door Worker` (staff)
- `Manager User` (manager)
- `Admin User` (admin)

## Subscriptions (App Store / Play Store)

- The app uses RevenueCat for real in-app subscriptions.
- Purchase flow is enabled in native app builds (iOS/Android), not plain web.
- Premium status is synced from RevenueCat entitlement `VITE_REVENUECAT_ENTITLEMENT_ID`.

RevenueCat setup checklist:
1. Create products in App Store Connect / Google Play Console.
2. Link products in RevenueCat and attach them to one entitlement (for example `premium`).
3. Configure a Current Offering in RevenueCat with at least one package.
4. Put RevenueCat public SDK keys in `.env.local` and rebuild native projects.

## iOS (Xcode / App Store) Build

1. Build and sync iOS shell:
   `npm run build:ios`
2. Open project in Xcode:
   `npm run ios:open`
3. In Xcode:
   - Select the `App` target
   - Set your Team and unique Bundle Identifier
   - Set iOS Deployment Target and signing
4. Archive for App Store:
   - Product -> Archive
   - Distribute App -> App Store Connect

If `xcodebuild` points to Command Line Tools instead of full Xcode, run:
`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
