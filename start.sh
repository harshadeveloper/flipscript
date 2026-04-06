#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  ScriptFlip — One-Command Setup & Start
#  Usage: bash start.sh
# ═══════════════════════════════════════════════════════════════════

set -e
CYAN='\033[0;36m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       ⚡ ScriptFlip Setup v1.0           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check Node.js ────────────────────────────────────────────────
echo -e "${YELLOW}▸ Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from: https://nodejs.org${NC}"
  exit 1
fi
NODE_VER=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VER${NC}"

# ── 2. Check FFmpeg ─────────────────────────────────────────────────
echo -e "${YELLOW}▸ Checking FFmpeg...${NC}"
if command -v ffmpeg &>/dev/null; then
  echo -e "${GREEN}✓ FFmpeg found${NC}"
else
  echo -e "${YELLOW}⚠ FFmpeg not found. Installing...${NC}"
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt-get update -qq && sudo apt-get install -y ffmpeg
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install ffmpeg
  else
    echo -e "${RED}Please install FFmpeg manually: https://ffmpeg.org/download.html${NC}"
  fi
fi

# ── 3. Check yt-dlp ─────────────────────────────────────────────────
echo -e "${YELLOW}▸ Checking yt-dlp...${NC}"
if command -v yt-dlp &>/dev/null; then
  echo -e "${GREEN}✓ yt-dlp found${NC}"
else
  echo -e "${YELLOW}⚠ yt-dlp not found. Installing...${NC}"
  if command -v pip3 &>/dev/null; then
    pip3 install yt-dlp --quiet
  elif command -v pip &>/dev/null; then
    pip install yt-dlp --quiet
  else
    sudo curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp
  fi
  echo -e "${GREEN}✓ yt-dlp installed${NC}"
fi

# ── 4. Install Node deps ─────────────────────────────────────────────
echo -e "${YELLOW}▸ Installing Node.js dependencies...${NC}"
cd "$(dirname "$0")/backend"
npm install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── 5. Configure .env ───────────────────────────────────────────────
if [ ! -f .env ]; then
  echo -e "${YELLOW}▸ Creating .env from template...${NC}"
  cp .env.example .env
  echo ""
  echo -e "${YELLOW}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠  ACTION REQUIRED: Configure your API keys        ║${NC}"
  echo -e "${YELLOW}╠══════════════════════════════════════════════════════╣${NC}"
  echo -e "${YELLOW}║  Edit:  backend/.env                                 ║${NC}"
  echo -e "${YELLOW}║                                                      ║${NC}"
  echo -e "${YELLOW}║  Required:                                           ║${NC}"
  echo -e "${YELLOW}║  ANTHROPIC_API_KEY=sk-ant-...                        ║${NC}"
  echo -e "${YELLOW}║  (Get it: https://console.anthropic.com/)            ║${NC}"
  echo -e "${YELLOW}║                                                      ║${NC}"
  echo -e "${YELLOW}║  Optional (for real Whisper transcription):          ║${NC}"
  echo -e "${YELLOW}║  OPENAI_API_KEY=sk-...                               ║${NC}"
  echo -e "${YELLOW}║                                                      ║${NC}"
  echo -e "${YELLOW}║  Optional (for real payments):                       ║${NC}"
  echo -e "${YELLOW}║  STRIPE_SECRET_KEY=sk_live_...                       ║${NC}"
  echo -e "${YELLOW}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  read -p "Press Enter to open .env for editing (or Ctrl+C to skip)..."
  ${EDITOR:-nano} .env
fi

# ── 6. Create runtime dirs ──────────────────────────────────────────
mkdir -p uploads temp data

# ── 7. Start server ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ⚡ ScriptFlip is starting...        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
PORT=$(grep "^PORT=" .env 2>/dev/null | cut -d= -f2 || echo "3001")
echo -e "${GREEN}→ Opening at: http://localhost:${PORT}${NC}"
echo -e "${CYAN}→ Test code: SF-DEMO-2024-FREE${NC}"
echo ""

# Open browser after 2s
(sleep 2 && (open "http://localhost:${PORT}" 2>/dev/null || xdg-open "http://localhost:${PORT}" 2>/dev/null)) &

node server.js
