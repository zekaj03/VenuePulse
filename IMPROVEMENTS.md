# VenuePulse - Recommended Improvements

## Status: Completed Items

✅ **DONE - License Key Generator:** HMAC-SHA256 implementation (`utils/crypto.ts`)
✅ **DONE - API Key Generation:** Uses `crypto.getRandomValues()` (`utils/crypto.ts`)
✅ **DONE - PIN Storage:** PBKDF2 hashing with salt (`utils/crypto.ts`)
✅ **DONE - Backup Validation:** Zod schema validation (`utils/backupSchema.ts`)
✅ **DONE - TypeScript Strict Mode:** Enabled in `tsconfig.json`, all errors fixed
✅ **DONE - localStorage Debouncing:** 500ms debounce implemented (`hooks/useLocalStorage.ts`)
✅ **DONE - Date.now() for IDs:** Replaced with `crypto.randomUUID()` (`utils/crypto.ts`)
✅ **DONE - Replace alert()/confirm():** Using ConfirmModal/AlertModal components
✅ **DONE - i18n String Replacement:** Using `replaceAll()` in translations
✅ **DONE - Config File:** Created `config.ts` with environment variable support
✅ **DONE - Structured Logger:** Created `utils/logger.ts`
✅ **DONE - Zod v4 Compatibility:** Fixed `z.record()` call

---

## Remaining Issues (by Priority)

## Critical (Must Fix)

### 1. API Key Stored in Plain Text in localStorage ⚠️
**File:** `App.tsx:690, 756`

API keys are stored and read from localStorage, which is accessible to any script or browser extension on the page.

**Note:** RevenueCat SDK requires API key to be accessible. This is a known limitation of client-side-only apps. Consider using a backend proxy for production deployments.

**Workaround:** Document this limitation clearly for users.

### 2. Monolithic App.tsx (2,558 lines) - Medium Priority
**File:** `App.tsx`

The entire application lives in a single component. This makes the code hard to test, review, and maintain.

**Recommendation:** Extract components incrementally:
- `CounterPanel` — entry/exit counting logic
- `ZoneManager` — zone CRUD and display
- `GuestList` — guest management
- `SettingsPanel` — settings form
- `HistoryView` — log display and search
- Use Context API or Zustand for shared state

---

## High Priority

### 6. Monolithic Component — App.tsx (2,558 lines)
**File:** `App.tsx`

The entire application lives in a single component with 70+ `useState` declarations, 20+ `useCallback` handlers, and all UI rendering. This makes the code hard to test, review, and maintain.

**Recommendation:** Extract components incrementally (see note above).

### 7. Excessive Use of `any` Type - ✅ FIXED
**Files:** `App.tsx:172, 203, 237, 563, 711`

TypeScript strict mode is now enabled and all `any` types have been resolved or properly typed.

### 8. State Persisted on Every Change - ✅ FIXED
**File:** `hooks/useLocalStorage.ts`

Debounced persistence (500ms delay) is implemented with selective key writes.

### 9. Test Coverage - ✅ IMPROVED
**File:** Various test files

Existing tests cover: crypto functions, validation, backup schema, modals, localStorage hooks, API state. Consider adding more for counter logic.

### 10. TypeScript Strict Mode - ✅ FIXED
**File:** `tsconfig.json`

`strict` mode is enabled and all TypeScript errors have been resolved.

### 12. No Pagination for Large Data Sets
Audit logs (capped at 1000), activity logs, and guest lists render all entries at once.

**Fix:** Add pagination or virtual scrolling (e.g., `react-window`).

### 13. No Environment Variable Validation
**File:** `vite.config.ts`

Environment variables are loaded but never validated at startup.

**Fix:** Validate required env vars on app init and fail fast with clear messages.

### 14. Hardcoded Configuration Values - ✅ FIXED
**File:** `config.ts`

Configuration file created with environment variable support. Values include:
- defaultMaxCapacity (200)
- capacityThresholds (50,75,90)
- auditLogMaxEntries (1000)
- sessionTimeout (30 min)
- freeTierLogLimit (50)

### 15. Fragile Date Handling in `loadValidatedState` - ✅ FIXED
**File:** `App.tsx`, `utils/backupSchema.ts`

Zod schema now uses `.transform()` for date fields.

### 16. Structured Logging - ✅ FIXED
**File:** `utils/logger.ts`

Structured logger implemented with severity levels and context support.

### 17. Simulated Sync — No Real Offline Support
**File:** `App.tsx:676-679, 1404-1417`

The sync function is a fake `setTimeout`. Offline detection uses only `navigator.onLine`.

**Recommendation:** Implement a Service Worker for real offline support and a backend sync endpoint with conflict resolution.

---

## Low Priority

### 18. `dangerouslySetInnerHTML` for Logo SVG
**File:** `App.tsx:1529`

While the SVG is currently hardcoded, using `dangerouslySetInnerHTML` is a code smell.

**Fix:** Convert to a React SVG component.

### 19. Browser `alert()`/`confirm()` Dialogs - ✅ FIXED
**File:** `App.tsx`

Replaced with ConfirmModal/AlertModal components.

### 20. i18n String Replacement - ✅ FIXED
**File:** `App.tsx:713-715`

Now using `replaceAll()` for translation replacements.

### 21. Missing ARIA Labels - ✅ MOSTLY FIXED
Most interactive elements have ARIA labels. Continue auditing new components.

### 22. localStorage Quota Management - ✅ PARTIALLY FIXED
**File:** `hooks/useLocalStorage.ts`

Error handling added for QuotaExceededError, but proactive quota checking not implemented.

**Fix:** Check `navigator.storage.estimate()` and warn users when storage is low.

### 23. Timezone-Unaware Date Handling
**File:** `App.tsx:528, 213-217`

`new Date()` and `toLocaleDateString()` without explicit timezone can cause issues around DST transitions.

**Fix:** Use `date-fns` or `day.js` with explicit timezone support.

---

## Summary

| Severity | Count | Key Theme |
|----------|-------|-----------|
| Critical | 5 | Security (keys, PINs, validation) |
| High | 5 | Architecture, types, testing |
| Medium | 7 | Performance, config, logging |
| Low | 6 | UX, a11y, minor code quality |

**Recommended first steps:**
1. Split `App.tsx` into smaller components
2. Move secrets and license validation to a backend
3. Enable TypeScript strict mode and eliminate `any`
4. Add test coverage for core business logic
5. Debounce localStorage persistence
