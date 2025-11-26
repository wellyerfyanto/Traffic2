FROM node:18-alpine

# Install dependencies untuk Puppeteer dan network tools
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    wget \
    python3 \
    py3-pip \
    build-base

# Install Python packages untuk proxy testing
RUN pip3 install requests

# Set Puppeteer untuk menggunakan Chromium yang diinstall
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set environment variables untuk proxy support
ENV NODE_ENV=production
ENV PROXY_TEST_URL=https://crptoajah.blogspot.com

# Buat non-root user untuk security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S githubbot -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Change ownership ke non-root user
RUN chown -R githubbot:nodejs /app
USER githubbot

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
