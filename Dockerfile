FROM node:20-alpine

# Install system deps: FFmpeg + yt-dlp + Python
RUN apk add --no-cache ffmpeg python3 py3-pip curl && \
    pip3 install yt-dlp --break-system-packages && \
    which yt-dlp && which ffmpeg

WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./
COPY frontend/public/ ./public/

# Create runtime dirs
RUN mkdir -p uploads temp data

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
