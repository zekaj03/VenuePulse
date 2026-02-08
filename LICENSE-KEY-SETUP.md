# VenuePulse Subscription Setup (RevenueCat)

The app now uses native in-app subscriptions via RevenueCat (App Store / Play Store), not local license keys.

## Environment Variables

Set these in `.env.local`:

```bash
VITE_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxx
VITE_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxx
VITE_REVENUECAT_ENTITLEMENT_ID=premium
```

## RevenueCat Dashboard

1. Create one entitlement (for example `premium`).
2. Add your App Store / Play Store products.
3. Create a Current Offering and attach at least one package (monthly/yearly).
4. Make sure the entitlement includes the purchased products.

## iOS Test Flow

1. Build and sync native shell: `npm run build:ios`
2. Open Xcode project: `npm run ios:open`
3. Configure Signing and Bundle Identifier.
4. Use a Sandbox test account on a real device or simulator with StoreKit test setup.
5. Open subscription modal in app:
   - `Upgrade` purchases the current RevenueCat package.
   - `Restore Purchases` restores previous purchases.
   - `Manage Subscription` opens the store management URL when available.

## Notes

- Subscription purchase/restore is enabled only in native builds.
- Web dev mode shows subscription UI but cannot complete native store purchases.
