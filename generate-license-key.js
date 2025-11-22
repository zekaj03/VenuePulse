#!/usr/bin/env node

/**
 * VenuePulse License Key Generator
 *
 * Usage: node generate-license-key.js [count]
 *
 * Generates valid license keys for VenuePulse Premium.
 * Keys format: VENUEPULSE-XXXX-XXXX-XXXX
 *
 * The last segment is a checksum to prevent simple forgery.
 */

function generateRandomSegment() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let segment = '';
  for (let i = 0; i < 4; i++) {
    segment += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return segment;
}

function calculateChecksum(dataSegments) {
  let sum = 0;
  for (let i = 0; i < dataSegments.length; i++) {
    sum += dataSegments.charCodeAt(i);
  }
  return (sum % 65536).toString(16).toUpperCase().padStart(4, '0');
}

function generateLicenseKey() {
  const segment1 = generateRandomSegment();
  const segment2 = generateRandomSegment();
  const dataSegments = segment1 + segment2;
  const checksum = calculateChecksum(dataSegments);

  return `VENUEPULSE-${segment1}-${segment2}-${checksum}`;
}

// Main execution
const count = parseInt(process.argv[2]) || 1;

console.log('\n🎫 VenuePulse License Key Generator\n');
console.log(`Generating ${count} license key(s)...\n`);

for (let i = 0; i < count; i++) {
  const key = generateLicenseKey();
  console.log(`${i + 1}. ${key}`);
}

console.log('\n✅ Done! Copy any key above and paste it into VenuePulse.\n');
console.log('💡 Tip: Save these keys for your customers or Gumroad product setup.\n');
