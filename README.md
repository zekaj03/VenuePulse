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
