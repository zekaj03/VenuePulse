# VenuePulse License Key System

## Overview

VenuePulse now uses a **license key system** instead of online payment processing. This allows you to:
- ✅ Accept payments through any platform (Gumroad, Stripe, PayPal, bank transfer, etc.)
- ✅ Generate and distribute license keys to customers
- ✅ No backend or server costs
- ✅ Works completely offline
- ✅ Simple and secure validation

## How It Works

1. **Customer pays** → You receive payment via your chosen platform
2. **You generate** → Create a license key using the generator script
3. **Customer activates** → They enter the key in VenuePulse app
4. **Premium unlocked** → All premium features are instantly available

## Generating License Keys

### Quick Start
```bash
# Generate 1 license key
node generate-license-key.js

# Generate 10 license keys
node generate-license-key.js 10
```

### Example Output
```
🎫 VenuePulse License Key Generator

Generating 3 license key(s)...

1. VENUEPULSE-A3X9-K2M7-4F1E
2. VENUEPULSE-B7Y4-P8N3-9A2C
3. VENUEPULSE-C1Z6-Q5L9-8D3B

✅ Done! Copy any key above and paste it into VenuePulse.
```

## Setting Up Sales (FREE Options)

### Option 1: Gumroad (Recommended - Easiest)
**Cost**: Free to set up, 10% fee on sales

1. Go to [gumroad.com](https://gumroad.com)
2. Create product "VenuePulse Premium"
3. Set price: 12 CHF/month (or one-time)
4. Enable "License Keys" in product settings
5. Paste generated keys into Gumroad
6. Customers get keys automatically via email!

**Pros**: Fully automated, professional, handles everything

### Option 2: Stripe Payment Links
**Cost**: Free to set up, 2.9% + 0.30 CHF per transaction

1. Create Stripe account (free)
2. Create payment link for 12 CHF
3. When customer pays, manually email them a key
4. (Optional) Use Zapier free tier to automate email

**Pros**: Lowest fees, full control

### Option 3: Manual (Email/Invoice)
**Cost**: $0

1. Customer emails you
2. You send invoice (bank transfer, PayPal, etc.)
3. After payment, email them a license key
4. They activate in app

**Pros**: Complete control, no platform fees

## Key Format

```
VENUEPULSE-XXXX-XXXX-XXXX
```

- **Prefix**: `VENUEPULSE-` (identifies your app)
- **Segment 1-2**: Random alphanumeric (4 chars each)
- **Segment 3**: Checksum (prevents forgery)

## Security Features

✅ **Checksum validation** - Keys can't be guessed or forged
✅ **Offline validation** - No internet required
✅ **Local storage** - Keys stored securely in browser
✅ **No expiration** - Lifetime licenses by default

## Customer Instructions

Send this to your customers after purchase:

---

**Welcome to VenuePulse Premium!**

Thank you for your purchase. Here's how to activate:

1. Open VenuePulse
2. Click the subscription icon (crown)
3. Enter your license key: `VENUEPULSE-XXXX-XXXX-XXXX`
4. Click "Activate License"
5. Enjoy all Premium features!

Your license is valid forever and works completely offline.

Questions? Email: support@venuepulse.com

---

## FAQ

**Q: Can customers share keys?**
A: Currently yes, but you can add server validation later to prevent this.

**Q: How do I revoke a key?**
A: Currently manual (contact customer). Add server validation for auto-revocation.

**Q: Can I offer monthly subscriptions?**
A: Use Gumroad's membership feature to issue time-limited keys monthly.

**Q: How do I track usage?**
A: Add simple analytics endpoint (free with Cloudflare Workers) to track activations.

## Upgrade Path (Optional - Future)

When you want more control, add a simple validation API:

1. Deploy free Cloudflare Worker (100k requests/day free)
2. Store valid keys in KV storage (free tier)
3. App checks key validity on activation
4. Track usage, prevent sharing, enable revocation

Total cost: **$0** (stays within free tier)

## Support

Need help? Questions?
- Email: support@venuepulse.com
- Generate keys: `node generate-license-key.js`

## Next Steps

1. ✅ Generate some test keys
2. ✅ Try activating in the app
3. ✅ Set up your sales platform (Gumroad recommended)
4. ✅ Start selling!

Happy selling! 🚀
