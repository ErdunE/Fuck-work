# URL Construction Safety Audit (Phase 4.1.4.4.1)

## Audit Date
2024-12-14

## Scope
All files in `apps/extension/`

## Findings

### ✅ Safe: All `new URL()` Calls

**Total occurrences:** 5  
**Location:** `content.js` only  
**Status:** All wrapped in try/catch inside `safeParseURL()` and `safeParseURLInternal()`

```
Line 118: return new URL(str);                    // try/catch ✓
Line 126: const origin = new URL(safeFallback).origin; // try/catch ✓
Line 127: return new URL(str, origin);             // try/catch ✓
Line 136: return new URL('https://' + str);        // try/catch ✓
Line 152: return new URL(urlString);               // try/catch ✓
```

### ✅ Safe: Browser Native Location Access

Files using `window.location.href` or `window.location.hostname`:
- `ats_detector.js:19-20` - Browser native, never throws
- `apply_stage_detector.js:16` - Browser native, never throws  
- `user_action_intent_detector.js:27` - Browser native, never throws
- `content.js` (multiple) - Browser native, never throws

**Risk:** None. Browser always provides these properties.

### ✅ Safe: Mock URL Object

When all URL parsing fails, `safeParseURLInternal()` returns:

```javascript
{
  href: href,                          // string
  searchParams: new URLSearchParams(), // REAL URLSearchParams (not mock!)
  toString: () => href,
  hostname: '',
  pathname: '/',
  origin: '',
  protocol: '',
  search: '',
  hash: ''
}
```

**Critical:** `searchParams` is a **real URLSearchParams instance**, so:
- `.get(key)` ✅ works
- `.has(key)` ✅ works
- `.set(key, value)` ✅ works
- `.forEach(callback)` ✅ works

### ✅ Safe: No Unguarded URL Construction

**Checked files:**
- `api.js` - No URL construction ✅
- `apply_session.js` - No URL construction ✅
- `apply_stage_detector.js` - Only uses `window.location` ✅
- `apply_state_machine.js` - No URL construction ✅
- `ats_detector.js` - Only uses `window.location` ✅
- `ats_types.js` - No URL construction ✅
- `background.js` - No URL construction ✅
- `content.js` - All `new URL()` wrapped ✅
- `popup.js` - No URL construction ✅
- `user_action_intent_detector.js` - Only uses `window.location` ✅
- `user_guidance.js` - No URL construction ✅

## Edge Cases Handled

### 1. Null/Undefined
```javascript
safeParseURL(null) → uses window.location.href
safeParseURL(undefined) → uses window.location.href
```

### 2. Empty String
```javascript
safeParseURL('') → uses window.location.href
```

### 3. Missing Protocol
```javascript
safeParseURL('www.linkedin.com') → 'https://www.linkedin.com'
safeParseURL('linkedin.com/jobs') → 'https://linkedin.com/jobs'
```

### 4. Relative Path
```javascript
safeParseURL('/jobs/view/123') → prepends current origin
```

### 5. Garbage String
```javascript
safeParseURL('@@@@invalid') → falls back to window.location.href
```

### 6. Fallback Also Fails
```javascript
// Returns mock object with real URLSearchParams
// Never throws
```

## Verification Tests

### Test 1: Init with Invalid URL
```javascript
// Even if somehow location.href is corrupted:
// - content.js will still load
// - overlay will still be created
// - only console.warn appears
```

### Test 2: Detection with Bad Input
```javascript
// Detectors use window.location directly (always safe)
// No URL construction from variables
```

### Test 3: Mock Object Usage
```javascript
const mockURL = safeParseURL('garbage');
mockURL.href; // ✓ string
mockURL.hostname; // ✓ '' (empty string, not undefined)
mockURL.searchParams.get('key'); // ✓ works (returns null if not found)
mockURL.toString(); // ✓ returns href string
```

## Expected Logs

### ❌ Should NEVER appear:
```
Failed to construct 'URL': Invalid URL
Uncaught TypeError: Failed to construct 'URL'
```

### ✅ Allowed (warning):
```
[FW URL] Invalid URL encountered { input, fallback_used }
```

### ✅ Still works:
```
[FW Injected] content.js loaded
[FW Session] Loaded ... active: true
[FW Invariant] Session active → overlay must exist
[FW Overlay] Created
```

## Risk Assessment

| Component | Risk | Mitigation |
|-----------|------|------------|
| URL parsing | LOW | All wrapped in safeParseURL |
| Mock object properties | LOW | All expected properties present |
| searchParams usage | LOW | Real URLSearchParams instance |
| Hostname checks | NONE | Uses browser native |
| Session current_url | LOW | Falls back to window.location.href |

## Conclusion

✅ **PASS** - All URL construction is hardened.  
✅ **PASS** - No unguarded `new URL()` calls outside safe helpers.  
✅ **PASS** - Mock object has all required properties.  
✅ **PASS** - searchParams is functional (not just a mock).  

**Status:** Ready for production use.

## Commit

Phase 4.1.4.4 (already committed): b57e5c7
Phase 4.1.4.4.1 (this audit): Documentation only, no code changes needed.

