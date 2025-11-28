FROM node:18-alpine

WORKDIR /app

# Copy package files first untuk caching
COPY package*.json ./
COPY *.js ./
COPY *.json ./

# Install dependencies
RUN npm install --omit=dev && \
    npm install puppeteer-core@21.5.2 https-proxy-agent@7.0.2 socks-proxy-agent@8.0.2 user-agents@1.1.1

# Copy semua file
COPY . .

# Install Chromium
RUN apk update && apk add --no-cache chromium

# Buat directory public
RUN mkdir -p public

# Set environment
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 3000

CMD ["node", "server.js"]
