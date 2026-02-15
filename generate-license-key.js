#!/usr/bin/env node

/**
 * VenuePulse License Key Generator (SECURE VERSION)
 *
 * Usage: node generate-license-key.js [count] [secret]
 *
 * Generates cryptographically signed license keys for VenuePulse Premium.
 * Keys format: VENUEPULSE-XXXX-XXXX-XXXX-XXXX
 *
 * Requires a secret key for signing. Set VENUEPULSE_SECRET env variable.
 */

const crypto = require('crypto');

const SECRET = process.env.VENUEPULSE_SECRET || 'default-dev-secret-change-in-production';

function generateRandomSegment(length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let segment = '';
  for (let i = 0; i < length; i++) {
    segment += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return segment;
}

function generateLicenseKey() {
  // Generate random license data
  const segment1 = generateRandomSegment(4);
  const segment2 = generateRandomSegment(4);
  const segment3 = generateRandomSegment(4);
  const data = `${segment1}-${segment2}-${segment3}`;

  // Create HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex').toUpperCase().slice(0, 4);

  return `VENUEPULSE-${data}-${signature}`;
}

// Main execution
const count = parseInt(process.argv[2]) || 1;

console.log('\n🔐 VenuePulse License Key Generator (Secure)\n');
console.log(`Generating ${count} license key(s)...\n`);
console.log(`⚠️  Using ${SECRET === 'default-dev-secret-change-in-production' ? 'DEFAULT SECRET - CHANGE IN PROD!' : 'custom secret'}\n`);

for (let i = 0; i < count; i++) {
  const key = generateLicenseKey();
  console.log(`${i + 1}. ${key}`);
}

console.log('\n✅ Done! Copy any key above and paste it into VenuePulse.\n');
console.log('💡 Tip: Set VENUEPULSE_SECRET environment variable for production.\n');
