[file name]: install.sh
[file content begin]
#!/bin/bash
echo "🔧 Installing GitHub Traffic Bot dependencies..."

# Install main dependencies
npm install --omit=dev

# Install specific versions of required packages
npm install puppeteer-core@21.5.2
npm install https-proxy-agent@7.0.2
npm install socks-proxy-agent@8.0.2
npm install user-agents@1.1.1

echo "✅ Dependencies installed successfully!"
[file content end]