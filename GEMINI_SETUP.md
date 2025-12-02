# Gemini API Setup Guide

## Current Status
Your Gemini API key is in `.env.local`:
```
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBpxmD7JpMyBkzzuV9P9XIXxZvAIILWYbs
```

## Common Issues & Solutions

### Issue 1: "Gemini API key not configured"
**Solution:** Restart the server
1. Stop server (Ctrl+C)
2. Run: `npm run dev`
3. Wait for "Ready" message
4. Try again

### Issue 2: "Gemini API error: 400/403/401"
**Possible causes:**
- Invalid API key
- API key not enabled for Gemini API
- API key doesn't have proper permissions

**Solution:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Verify your API key is active
3. Make sure it has access to Gemini API
4. Try generating a new key if needed

### Issue 3: API Key Not Loading
**Check:**
1. Verify `.env.local` exists in project root
2. Check file has no extra spaces or quotes
3. Variable name must be exactly: `NEXT_PUBLIC_GEMINI_API_KEY`
4. Restart server after adding key

## Verify API Key

1. Check browser console for detailed error
2. Look for error message with status code (400, 403, etc.)
3. Check if error mentions "API key" or "permission"

## Test Your API Key

You can test your API key directly:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Next Steps

1. **Restart server** (if you haven't already)
2. **Check browser console** for detailed error message
3. **Verify API key** at Google AI Studio
4. **Try a simple question** in AI Mentor

## If Still Not Working

Share the exact error message from browser console (F12 > Console tab) and I'll help debug further.

