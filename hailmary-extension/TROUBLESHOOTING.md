# HailMary v3.0 — Troubleshooting Guide

## Service Worker Registration Issues

### Error: "Service worker registration failed. Status code: 15"

**Fixed in v3.0.0** — Added `alarms` permission to manifest.json.

**If you still see this error:**

1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find HailMary
   - Click the refresh icon (circular arrow)
   - Check the "Errors" button — should show no errors

2. **Check the service worker console:**
   - Go to `chrome://extensions/`
   - Find HailMary
   - Click "service worker" link (blue text)
   - You should see:
     ```
     [HailMary] Background service worker loading...
     [HailMary] Alarms API configured
     [HailMary] Background service worker loaded successfully
     ```

3. **If service worker shows errors:**
   - Check for syntax errors in background.js
   - Make sure all permissions are in manifest.json
   - Try removing and re-adding the extension

### Error: "Cannot read properties of undefined (reading 'create')"

**Cause:** Missing `alarms` permission in manifest.json

**Fix:** Already fixed in v3.0.0. If you see this:
1. Make sure you're using the latest manifest.json
2. Reload the extension
3. Check that `"alarms"` is in the permissions array

## Knowledge Fetching Issues

### No techniques being fetched

**Check the service worker console:**
```javascript
// Should see these logs:
[HailMary] Starting first knowledge fetch...
[HailMary] Fetch failed for X: HTTP 403  // Some sources may fail, that's OK
```

**Common causes:**
- **CORS errors**: Some sources may block extension requests — this is normal, the extension will skip them
- **Network issues**: Check your internet connection
- **Rate limiting**: Semantic Scholar may rate-limit — wait a few minutes and reload

**Manual check:**
1. Open the popup
2. Open DevTools (F12)
3. Go to Console tab
4. Type: `chrome.storage.local.get('hm_knowledge', console.log)`
5. You should see `techniques: [...]` with an array of techniques

### Techniques not being used

**Check if knowledge is loaded:**
1. Enhance a prompt
2. Look at the stats bar at the bottom
3. Should show "X web techniques" if knowledge is loaded

**If showing 0 web techniques:**
- Wait 3 seconds after install for first fetch
- Check service worker console for fetch errors
- Manually trigger fetch (coming soon in UI)

## Engine Issues

### Error: "Prompt cannot be empty"

**Cause:** You clicked the enhance button without typing anything

**Fix:** Type a prompt first, then click enhance

### Enhanced prompt looks weird

**Check:**
- Is the original prompt very short? (< 5 words) — the engine expands vague prompts
- Is depth set to 5 (GOD)? — this adds a lot of instructions
- Try depth 3 (ENHANCED) for most use cases

### "Engine failed to load" error

**Cause:** engine.js didn't load properly

**Fix:**
1. Check browser console (F12) for errors
2. Make sure engine.js exists in the extension folder
3. Reload the extension
4. If error persists, check engine.js syntax: `node --check engine.js`

## Auto-Inject Issues

### Inject button doesn't work

**Check:**
1. Are you on a supported AI page?
   - ChatGPT (chat.openai.com, chatgpt.com)
   - Claude (claude.ai)
   - Gemini (gemini.google.com)
   - Perplexity (perplexity.ai)
   - Poe (poe.com)
   - Grok (grok.com, x.com)
   - You.com (you.com)

2. Is the status dot green?
   - Green = connected to AI page
   - Yellow/gray = not on a supported page

3. Does the page have an input field?
   - Some AI pages load slowly
   - Wait for the page to fully load
   - Refresh the page if needed

### Auto-submit doesn't work

**Common causes:**
- Page structure changed (AI sites update frequently)
- Input field not focused
- Submit button not found

**Workaround:**
- Disable auto-submit
- Use auto-inject only
- Manually press Enter after inject

## Performance Issues

### Extension is slow

**Check:**
1. How many techniques are stored?
   - Open service worker console
   - Type: `chrome.storage.local.get('hm_knowledge', d => console.log(d.hm_knowledge.techniques.length))`
   - Should be < 200

2. Clear history if it's large:
   - Open popup DevTools
   - Type: `chrome.storage.local.set({hm_hist: []}, () => console.log('cleared'))`

3. Depth level:
   - Depth 5 (GOD) is slower than depth 3
   - Use depth 3-4 for most cases

### Knowledge fetch is slow

**Normal behavior:**
- First fetch takes 10-20 seconds (fetches from 6 sources)
- Subsequent fetches are cached for 6 hours
- Some sources may timeout (8-10 second limit per source)

## Storage Issues

### "Storage quota exceeded"

**Unlikely but possible if:**
- You have 1000+ enhancements in history
- Knowledge base is corrupted

**Fix:**
```javascript
// Clear all HailMary storage (in popup DevTools console):
chrome.storage.local.remove(['hm_v3', 'hm_hist', 'hm_knowledge', 'hm_memory'], () => {
  console.log('Storage cleared');
  location.reload();
});
```

## Debugging Tips

### Enable verbose logging

**Service worker console:**
```javascript
// Check knowledge status
chrome.storage.local.get(['hm_knowledge', 'hm_memory'], console.log);

// Manually trigger knowledge fetch
chrome.runtime.sendMessage({type: 'FETCH_KNOWLEDGE_NOW'}, console.log);

// Check memory/learning data
chrome.storage.local.get('hm_memory', console.log);
```

**Popup console:**
```javascript
// Check if engine loaded
console.log(window.HailMaryEngine);

// Test enhance (returns Promise)
window.HailMaryEngine.enhance('write a poem', 'auto', 'auto', {depth: 3})
  .then(console.log);
```

### Check extension version

**In popup:**
- Look at the header: should say "v3.0"
- Look at the footer: should say "HailMary v3.0"

**In manifest.json:**
- Should say `"version": "3.0.0"`

## Still Having Issues?

1. **Reload the extension** (chrome://extensions/ → refresh icon)
2. **Check all console logs** (service worker + popup)
3. **Verify all files are present:**
   - manifest.json
   - background.js
   - engine.js
   - popup.js
   - popup.html
   - popup.css
   - content.js
   - icons/ folder with 3 PNG files

4. **Try a clean reinstall:**
   - Remove the extension
   - Close Chrome completely
   - Reopen Chrome
   - Load the extension again

5. **Check Chrome version:**
   - Need Chrome 88+ or Edge 88+
   - Go to `chrome://version/` to check

## Known Limitations

- **Semantic Scholar API**: May rate-limit after many requests (wait 5-10 minutes)
- **GitHub raw files**: May be slow or timeout occasionally
- **CORS restrictions**: Some sources may block extension requests
- **AI page changes**: Auto-inject may break if AI sites update their HTML structure

## Success Indicators

**Everything is working if you see:**

1. ✅ Service worker console shows "loaded successfully"
2. ✅ First knowledge fetch completes (check after 10-20 seconds)
3. ✅ Enhanced prompts show "X web techniques" in stats
4. ✅ Status dot is green on AI pages
5. ✅ Auto-inject works on ChatGPT/Claude
6. ✅ History saves and loads correctly

---

**HailMary v3.0** — If you're still stuck, check the service worker console first — that's where most errors show up.
