# KutzApp Email Worker (Cloudflare)

This directory contains the Cloudflare Worker that handles email sending for KutzApp.

## Setup Steps

### 1. Enable Email Sending in Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → select **kutzapp.com**
2. Navigate to **Email** → **Email Sending** (or **Email Routing** → **Email Workers**)
3. Click **Enable** and follow the domain verification steps
4. Cloudflare will automatically add the required DNS records (MX, SPF, DKIM, DMARC)

### 2. Deploy the Worker

```bash
# Install wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# From this directory, deploy the worker
cd cloudflare-email-worker
wrangler deploy
```

### 3. Set the Secret
```bash
# Set the shared auth secret (use any strong random string)
wrangler secret put EMAIL_AUTH_SECRET
# Enter a strong secret, e.g.: kutzapp_email_s3cret_2024!

# Note this secret — you'll add it to your Vercel env as CLOUDFLARE_EMAIL_WORKER_SECRET
```

### 4. Add Environment Variables to Vercel
In your Vercel project settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `CLOUDFLARE_EMAIL_WORKER_URL` | `https://kutzapp-email.YOUR_SUBDOMAIN.workers.dev` |
| `CLOUDFLARE_EMAIL_WORKER_SECRET` | The secret you set in step 3 |
| `EMAIL_FROM` | `notifications@kutzapp.com` |

### 5. Test
```bash
curl -X POST https://kutzapp-email.YOUR_SUBDOMAIN.workers.dev \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer YOUR_SECRET" \
 -d '{
  "from": "notifications@kutzapp.com",
  "to": "rajaav@gmail.com",
  "subject": "Test from KutzApp",
  "html": "<h1>It works!</h1>"
 }'
```
