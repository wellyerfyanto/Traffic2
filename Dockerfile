FROM node:18-alpine

# Install dependencies untuk Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget

# Set Puppeteer untuk menggunakan Chromium yang diinstall
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set environment variables
ENV NODE_ENV=production

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

# Health check menggunakan wget (tersedia di Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
