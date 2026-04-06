# ⚡ ScriptFlip — Complete Production Setup

## Architecture
```
scriptflip/
├── backend/
│   ├── server.js              # Express server (port 3001)
│   ├── routes/
│   │   ├── analysis.js        # Video processing + AI analysis routes
│   │   ├── payments.js        # Stripe payment + webhook routes
│   │   └── access.js          # Access code validation
│   ├── services/
│   │   ├── videoProcessor.js  # FFmpeg audio + frame extraction
│   │   ├── whisper.js         # Speech-to-text (OpenAI Whisper or Claude fallback)
│   │   ├── claude.js          # Claude Vision + script generation
│   │   ├── scraper.js         # yt-dlp YouTube/Instagram/TikTok downloader
│   │   ├── accessCodes.js     # Code generation + validation
│   │   └── email.js           # Nodemailer access code delivery
│   ├── data/                  # access_codes.json (auto-created)
│   ├── uploads/               # Uploaded video files (auto-created)
│   ├── temp/                  # Temp audio/frames (auto-cleaned)
│   ├── .env.example           # Copy to .env and fill in keys
│   └── package.json
└── frontend/
    └── public/
        └── index.html         # Complete SPA frontend
```

---

## Quick Start (5 minutes)

### 1. Install system dependencies
```bash
# FFmpeg (required for audio extraction)
sudo apt-get install ffmpeg          # Ubuntu/Debian
brew install ffmpeg                  # macOS

# yt-dlp (required for YouTube/Instagram/TikTok downloads)
pip install yt-dlp
# OR
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp
```

### 2. Install Node dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your real API keys (see below)
```

### 4. Start the server
```bash
npm start
# → Server running at http://localhost:3001
# → Frontend served at http://localhost:3001
```

---

## API Keys Required

### 🔑 Anthropic (Required)
- Get at: https://console.anthropic.com/
- Used for: Claude Vision frame analysis + script generation
- `ANTHROPIC_API_KEY=sk-ant-...`

### 🔑 OpenAI Whisper (Optional but recommended)
- Get at: https://platform.openai.com/api-keys
- Used for: Real speech-to-text transcription
- Without it: Claude simulates realistic transcripts (still useful for demos)
- `OPENAI_API_KEY=sk-...`

### 💳 Stripe (For real payments)
1. Create account at https://stripe.com
2. Get Secret Key from https://dashboard.stripe.com/apikeys
3. Create a product + price ($49 one-time) → copy Price ID
4. Set up webhook: Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://yoursite.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`
   - Copy webhook secret
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

### 📧 Email (For code delivery)
**Gmail (easiest):**
1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate app password
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**SendGrid (production):**
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.your-sendgrid-api-key
```

---

## Production Deployment

### Deploy to Railway (recommended, free tier)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway domain  # get your URL
```

### Deploy to Render
1. Connect GitHub repo at https://render.com
2. New Web Service → select repo
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`
5. Add environment variables in Render dashboard

### Deploy to VPS (Ubuntu)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone and start
git clone <your-repo>
cd scriptflip/backend && npm install
cp .env.example .env && nano .env  # fill in keys
pm2 start server.js --name scriptflip
pm2 startup && pm2 save

# Nginx reverse proxy
sudo apt install nginx
# Configure nginx to proxy :80 → :3001
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Increase for video uploads
    client_max_body_size 500M;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_read_timeout 300s;  # Long timeout for video processing
        proxy_send_timeout 300s;
    }
}
```

---

## Test Access Codes
These always work (no payment needed):
- `SF-DEMO-2024-FREE`
- `SF-TEST-ABCD-1234`
- Any code starting with `SF-` that is 16+ chars

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server health + service status |
| POST | /api/analyze/url | Start analysis from URL |
| POST | /api/analyze/upload | Start analysis from file upload |
| GET | /api/analyze/status/:id | Poll job status |
| POST | /api/analyze/transcript-stream | SSE: stream transcript |
| POST | /api/analyze/vision-stream | SSE: stream vision analysis |
| POST | /api/analyze/flip | SSE: stream generated script |
| POST | /api/access/validate | Validate access code |
| POST | /api/payments/create-intent | Create Stripe PaymentIntent |
| POST | /api/payments/demo-purchase | Test purchase (no real charge) |
| POST | /api/payments/webhook | Stripe webhook handler |

---

## Free vs Pro Features

| Feature | Free | Pro |
|---------|------|-----|
| Flips per month | 3 | Unlimited |
| Video upload | ✓ (60s) | ✓ (10 min) |
| URL analysis | ✓ | ✓ |
| Whisper transcription | ✓ | ✓ |
| Claude Vision | ✗ | ✓ |
| Tone modes | 1 (Punchy) | 5 |
| Export watermark | Yes | No |
| Cut rate analysis | ✗ | ✓ |
| Priority processing | ✗ | ✓ |

---

## Environment Variable Reference

```bash
# Required
ANTHROPIC_API_KEY=        # Anthropic API key
PORT=3001                 # Server port

# Strongly recommended  
OPENAI_API_KEY=           # OpenAI Whisper (falls back to Claude simulation without)
STRIPE_SECRET_KEY=        # Stripe secret key
STRIPE_WEBHOOK_SECRET=    # Stripe webhook signing secret
EMAIL_USER=               # SMTP email user
EMAIL_PASS=               # SMTP email password

# Optional
STRIPE_PRICE_ID=          # Stripe price ID for checkout sessions
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=               # Sender display name + email
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
MAX_FILE_SIZE_MB=500
UPLOAD_DIR=./uploads
TEMP_DIR=./temp
TEST_ACCESS_CODES=SF-DEMO-2024-FREE,SF-TEST-ABCD-1234
FREE_FLIPS_PER_MONTH=3
INSTAGRAM_COOKIES=        # Path to cookies.txt for private Instagram content
```

---

## Troubleshooting

**"yt-dlp not found"**
→ `pip install yt-dlp` or `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp`

**"FFmpeg not found"**
→ `sudo apt-get install ffmpeg` (Linux) or `brew install ffmpeg` (Mac)

**Instagram requires login**
→ Export cookies from your browser using a cookies.txt extension, save to a file, set `INSTAGRAM_COOKIES=/path/to/cookies.txt`

**Upload times out**
→ Increase `proxy_read_timeout` in Nginx, or use chunked upload for large files

**Stripe webhook 400 error**
→ Make sure raw body middleware runs BEFORE `express.json()` — already handled in server.js

---

## Support
Questions? Open an issue or email support@scriptflip.io
