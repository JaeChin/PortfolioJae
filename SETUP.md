# Portfolio AI Chat - Setup Guide

This guide walks you through setting up the AI Chat and Fit Check features for your portfolio.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Portfolio                           │
│                     (jaedonchin.dev)                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ index.html  │    │ ai-chat.js  │    │   ai-chat.css       │ │
│  └─────────────┘    └──────┬──────┘    └─────────────────────┘ │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTPS API calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (chat-api.js)                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /chat endpoint       │  /fit-check endpoint            │   │
│  │  - General Q&A        │  - Job description analysis     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                   GEMINI_API_KEY (env)                          │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Google Gemini API                              │
│                (gemini-1.5-flash model)                         │
│                                                                 │
│  Free tier: 15 requests/minute, 1M tokens/month                 │
└─────────────────────────────────────────────────────────────────┘
```

## Files to Add to Your Portfolio

```
your-portfolio/
├── index.html          # Update: add CSS link + script tag
├── css/
│   ├── style.css       # Existing
│   └── ai-chat.css     # NEW - chat widget styles
├── js/
│   ├── main.js         # Existing
│   └── ai-chat.js      # NEW - chat widget logic
└── data/
    └── context.json    # NEW - your experience data (reference only)
```

---

## Step 1: Get Google Gemini API Key (Free)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)
5. Save it somewhere secure - you'll need it for Cloudflare

**Free Tier Limits:**
- 15 requests per minute
- 1 million tokens per month
- No credit card required

---

## Step 2: Create Cloudflare Worker

### 2.1 Access Cloudflare Dashboard

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. In the left sidebar, click **Workers & Pages**
3. Click **Create application**
4. Select **Create Worker**

### 2.2 Deploy the Worker

1. Name your worker (e.g., `portfolio-chat-api`)
2. Click **Deploy** (with the default "Hello World" code)
3. Click **Edit code**
4. Delete all the code and paste the contents of `workers/chat-api.js`
5. Click **Save and deploy**

### 2.3 Add Environment Variable

1. Go back to your worker's settings
2. Click **Settings** tab
3. Click **Variables**
4. Under "Environment Variables", click **Add variable**
5. Name: `GEMINI_API_KEY`
6. Value: Paste your Gemini API key
7. Click **Encrypt** (important for security!)
8. Click **Save and deploy**

### 2.4 Note Your Worker URL

Your worker URL will be something like:
```
https://portfolio-chat-api.YOUR-SUBDOMAIN.workers.dev
```

Copy this URL - you'll need it in the next step.

---

## Step 3: Update the Frontend

### 3.1 Copy the New Files

Copy these files to your portfolio:

1. `css/ai-chat.css` → `your-portfolio/css/ai-chat.css`
2. `js/ai-chat.js` → `your-portfolio/js/ai-chat.js`

### 3.2 Update ai-chat.js with Your Worker URL

Open `js/ai-chat.js` and find this line near the top:

```javascript
const API_ENDPOINT = 'https://your-worker.your-subdomain.workers.dev';
```

Replace it with your actual Cloudflare Worker URL:

```javascript
const API_ENDPOINT = 'https://portfolio-chat-api.YOUR-SUBDOMAIN.workers.dev';
```

### 3.3 Update index.html

Add the CSS link in the `<head>` section:

```html
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/ai-chat.css">  <!-- ADD THIS -->
```

Add the script before the closing `</body>` tag:

```html
<script src="js/main.js"></script>
<script src="js/ai-chat.js"></script>  <!-- ADD THIS -->
</body>
```

---

## Step 4: Configure CORS (Important!)

In your Cloudflare Worker code (`chat-api.js`), update the CORS header for production:

Find this line:
```javascript
'Access-Control-Allow-Origin': '*',
```

Change it to your domain:
```javascript
'Access-Control-Allow-Origin': 'https://jaedonchin.dev',
```

Then redeploy the worker.

---

## Step 5: Test Locally

1. Start a local server:
   ```bash
   python -m http.server 8000
   ```

2. Open `http://localhost:8000`

3. You should see an "Ask AI" button in the bottom-right corner

4. Click it and try:
   - "What's Jaedon's experience?"
   - "Does he have any certifications?"
   - Switch to "Fit Check" tab and paste a job description

---

## Step 6: Deploy

Deploy your updated portfolio files to your VPS/Hostinger.

---

## Customization

### Update Your Context

The AI's knowledge comes from the `CONTEXT` object in `workers/chat-api.js`. Update it when:
- You get a new certification
- You complete a project
- You gain new experience
- You update your target roles/salary

### Change Suggested Questions

In `js/ai-chat.js`, find the `SUGGESTIONS` array:

```javascript
const SUGGESTIONS = [
    "What's Jaedon's experience?",
    "What certifications does he have?",
    "Tell me about his projects",
    "Is he available for hire?",
    "What are his skills?"
];
```

### Customize the System Prompt

In `workers/chat-api.js`, you can modify `CHAT_SYSTEM_PROMPT` and `FIT_CHECK_SYSTEM_PROMPT` to change how the AI responds.

---

## Troubleshooting

### "Failed to get response" error

1. Check that your Cloudflare Worker is deployed
2. Verify the `API_ENDPOINT` in `ai-chat.js` matches your worker URL
3. Check the browser console for CORS errors
4. Make sure `GEMINI_API_KEY` is set in your worker's environment variables

### CORS errors

Make sure the `Access-Control-Allow-Origin` header in your worker matches your domain exactly (including `https://`).

### Rate limiting

Gemini free tier allows 15 requests/minute. If you hit this:
- Wait a minute and try again
- Consider upgrading to a paid plan for high-traffic sites

### Chat not appearing

1. Check browser console for JavaScript errors
2. Verify both CSS and JS files are loading (Network tab)
3. Make sure the script tag comes after `main.js`

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Google Gemini API | Free (15 RPM, 1M tokens/month) |
| Cloudflare Workers | Free (100k requests/day) |
| **Total** | **$0/month** |

For a portfolio with moderate traffic (100-500 visits/month), this setup is completely free.

---

## Security Notes

1. **Never expose your Gemini API key in frontend code** - it's stored securely in Cloudflare's encrypted environment variables

2. **CORS is configured** - only your domain can call the API

3. **No user data is stored** - conversations are stateless

4. **Rate limiting is built-in** - Gemini's limits prevent abuse

---

## Next Steps (Optional Enhancements)

1. **Add conversation history** - Store messages in localStorage for persistence
2. **Add analytics** - Track popular questions via Cloudflare Analytics
3. **Custom domain for API** - Set up `api.jaedonchin.dev` via Cloudflare
4. **Add more context** - Include blog posts, detailed project docs
5. **Streaming responses** - Show responses as they generate (requires SSE)

---

## File Reference

| File | Purpose |
|------|---------|
| `workers/chat-api.js` | Cloudflare Worker - handles API requests |
| `css/ai-chat.css` | Styles for the chat widget |
| `js/ai-chat.js` | Frontend logic for chat UI |
| `data/context.json` | Reference data (embedded in worker) |
| `index.html` | Updated portfolio with chat integrated |
