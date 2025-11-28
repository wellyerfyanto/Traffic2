{
  "name": "github-traffic-bot",
  "version": "2.5.0",
  "description": "Automated traffic generator dengan Auto-Switch Proxy System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "install-deps": "npm install --omit=dev && npm install puppeteer-core@21.5.2 https-proxy-agent@7.0.2 socks-proxy-agent@8.0.2 user-agents@1.1.1",
    "docker:build": "docker build -t github-traffic-bot .",
    "docker:run": "docker run -p 3000:3000 github-traffic-bot",
    "docker:compose": "docker-compose up -d",
    "test": "node -e \"console.log('Testing environment...'); require('./trafficGenerator.js'); console.log('✅ All modules loaded successfully');\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "puppeteer-core": "^21.5.2",
    "user-agents": "^1.1.1",
    "axios": "^1.6.2",
    "https-proxy-agent": "^7.0.2",
    "socks-proxy-agent": "^8.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": [
    "github",
    "traffic",
    "bot",
    "proxy",
    "auto-switch",
    "automation",
    "puppeteer",
    "railway"
  ],
  "author": "Erimo Hack",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/github-traffic-bot"
  }
}
