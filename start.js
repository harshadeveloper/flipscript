#!/usr/bin/env node
/**
 * ScriptFlip — Start Script
 * Run: node start.js
 *
 * Checks all dependencies, prints setup instructions if anything's missing,
 * then starts the server.
 */

const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

const ok   = (msg) => console.log(`  ${GREEN}✓${RESET}  ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠${RESET}  ${msg}`);
const fail = (msg) => console.log(`  ${RED}✗${RESET}  ${msg}`);
const info = (msg) => console.log(`  ${CYAN}→${RESET}  ${msg}`);

console.log(`\n${BOLD}⚡ ScriptFlip — Startup Check${RESET}\n`);

let hasErrors = false;
let hasWarnings = false;

// ─── Check .env ───────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, 'backend', '.env');
const envExamplePath = path.join(__dirname, 'backend', '.env.example');

if (!fs.existsSync(envPath)) {
  warn('.env not found — creating from .env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    info(`Created backend/.env — please edit it with your API keys`);
  } else {
    fail('.env.example not found either — please create backend/.env manually');
  }
  hasWarnings = true;
} else {
  ok('.env file found');
}

// Load env
require('dotenv').config({ path: envPath });

// ─── Check API Keys ───────────────────────────────────────────────────────────
console.log(`\n${BOLD}API Keys:${RESET}`);

if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-key')) {
  ok('ANTHROPIC_API_KEY is set');
} else {
  fail('ANTHROPIC_API_KEY missing or placeholder — AI features will NOT work');
  info('Get yours at: https://console.anthropic.com/');
  info('Add to backend/.env: ANTHROPIC_API_KEY=sk-ant-...');
  hasErrors = true;
}

if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your')) {
  ok('OPENAI_API_KEY is set — real Whisper transcription enabled');
} else {
  warn('OPENAI_API_KEY not set — using Claude transcript simulation (still works!)');
  info('For real Whisper: https://platform.openai.com/api-keys');
  hasWarnings = true;
}

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your')) {
  ok('STRIPE_SECRET_KEY is set — payments enabled');
} else {
  warn('STRIPE_SECRET_KEY not set — payment will use demo mode (no real charges)');
  hasWarnings = true;
}

if (process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your')) {
  ok('Email configured — access codes will be emailed after purchase');
} else {
  warn('Email not configured — codes shown on screen only (not emailed)');
  hasWarnings = true;
}

// ─── Check System Tools ───────────────────────────────────────────────────────
console.log(`\n${BOLD}System Tools:${RESET}`);

function checkCommand(cmd, name, installHint) {
  try {
    execSync(`${cmd} --version`, { stdio: 'pipe' });
    ok(`${name} found`);
    return true;
  } catch {
    fail(`${name} not found`);
    info(`Install: ${installHint}`);
    return false;
  }
}

const ffmpegOk = checkCommand('ffmpeg', 'FFmpeg (audio extraction)', 'sudo apt-get install ffmpeg  OR  brew install ffmpeg');
const ytdlpOk  = checkCommand('yt-dlp', 'yt-dlp (URL downloads)',   'pip install yt-dlp  OR  https://github.com/yt-dlp/yt-dlp#installation');

if (!ffmpegOk) {
  fail('FFmpeg is REQUIRED for video processing');
  hasErrors = true;
}
if (!ytdlpOk) {
  warn('yt-dlp missing — URL analysis (YouTube/Instagram/TikTok) will not work');
  warn('File upload analysis will still work');
  hasWarnings = true;
}

// ─── Check Node modules ───────────────────────────────────────────────────────
console.log(`\n${BOLD}Node Modules:${RESET}`);

const backendDir  = path.join(__dirname, 'backend');
const nodeModules = path.join(backendDir, 'node_modules');

if (fs.existsSync(nodeModules)) {
  ok('node_modules found');
} else {
  warn('node_modules not found — running npm install...');
  try {
    execSync('npm install --no-audit --no-fund', { cwd: backendDir, stdio: 'inherit' });
    ok('npm install complete');
  } catch {
    fail('npm install failed — run manually: cd backend && npm install');
    hasErrors = true;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));

if (hasErrors) {
  console.log(`\n${RED}${BOLD}⚠ There are errors that need to be fixed before ScriptFlip will work correctly.${RESET}`);
  console.log(`${YELLOW}You can still start the server, but some features will be disabled.\n${RESET}`);
}

if (!hasErrors && !hasWarnings) {
  console.log(`\n${GREEN}${BOLD}✓ All checks passed! Starting ScriptFlip...${RESET}\n`);
}

if (hasWarnings && !hasErrors) {
  console.log(`\n${YELLOW}${BOLD}⚠ Some optional services are not configured. Starting anyway...${RESET}`);
  console.log(`${CYAN}See above for what's missing and how to add it.\n${RESET}`);
}

// ─── Start Server ─────────────────────────────────────────────────────────────
console.log(`${BOLD}Starting server...${RESET}\n`);

const server = spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error(`${RED}Failed to start server: ${err.message}${RESET}`);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`${RED}Server exited with code ${code}${RESET}`);
  }
  process.exit(code);
});

process.on('SIGINT',  () => { server.kill('SIGINT');  process.exit(0); });
process.on('SIGTERM', () => { server.kill('SIGTERM'); process.exit(0); });
