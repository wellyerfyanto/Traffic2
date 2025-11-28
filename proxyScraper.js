[file name]: proxyScraper.js
[file content begin]
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyScraper {
    constructor() {
        this.sources = [
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=all&timeout=10000&country=all',
            'https://www.proxy-list.download/api/v1/get?type=https',
            'https://www.proxy-list.download/api/v1/get?type=socks4',
            'https://www.proxy-list.download/api/v1/get?type=socks5'
        ];
        
        this.activeProxies = new Map();
        this.failedProxies = new Set();
    }

    detectProxyType(proxyUrl) {
        if (proxyUrl.includes('://')) {
            const parts = proxyUrl.split('://');
            return parts[0].toLowerCase();
        }
        return 'http';
    }

    formatProxyUrl(proxyUrl) {
        const proxyType = this.detectProxyType(proxyUrl);
        
        if (proxyUrl.includes('://')) {
            return proxyUrl;
        }
        
        return `http://${proxyUrl}`;
    }

    // 🆕 METHOD BARU: Ambil proxy TANPA TEST - langsung gunakan
    async getProxiesWithoutTest(maxProxies = 15) {
        console.log('🎯 Mengambil proxy TANPA TEST AWAL...');
        
        const allProxies = await this.scrapeProxies();
        
        if (allProxies.length === 0) {
            console.log('⚠️ Tidak ada proxy baru, menggunakan backup...');
            return this.getBackupProxies().slice(0, maxProxies);
        }
        
        console.log(`✅ ${Math.min(allProxies.length, maxProxies)} proxy siap digunakan TANPA TEST`);
        
        return allProxies.slice(0, maxProxies);
    }

    // 🆕 METHOD BARU: Test proxy saat runtime dengan timeout 60 detik
    async testProxyAtRuntime(proxyUrl, timeout = 60000) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({ 
                    proxy: proxyUrl, 
                    working: false, 
                    error: 'Timeout (60s) - Proxy tidak responsif',
                    testedAt: new Date() 
                });
            }, timeout);

            try {
                const agent = this.createProxyAgent(proxyUrl);
                const startTime = Date.now();
                
                // Test dengan situs cek IP yang cepat
                const response = await axios.get('https://httpbin.org/ip', {
                    httpsAgent: agent,
                    timeout: 55000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    validateStatus: function () {
                        return true;
                    }
                });
                
                const responseTime = Date.now() - startTime;
                
                clearTimeout(timeoutId);
                
                resolve({ 
                    proxy: proxyUrl, 
                    working: true, 
                    responseTime: responseTime,
                    detectedIP: response.data.origin,
                    proxyType: this.detectProxyType(proxyUrl),
                    testedAt: new Date()
                });
                
            } catch (error) {
                clearTimeout(timeoutId);
                resolve({ 
                    proxy: proxyUrl, 
                    working: false, 
                    error: this.simplifyError(error.message),
                    proxyType: this.detectProxyType(proxyUrl),
                    testedAt: new Date()
                });
            }
        });
    }

    createProxyAgent(proxyUrl) {
        const proxyType = this.detectProxyType(proxyUrl);
        const formattedUrl = this.formatProxyUrl(proxyUrl);
        
        switch (proxyType) {
            case 'https':
                return new HttpsProxyAgent(formattedUrl);
            case 'socks4':
            case 'socks5':
                return new SocksProxyAgent(formattedUrl);
            case 'http':
            default:
                return new HttpsProxyAgent(formattedUrl);
        }
    }

    extractIP(proxyUrl) {
        const matches = proxyUrl.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        return matches ? matches[0] : 'Unknown';
    }

    getBackupProxies() {
        return [
            '103.147.247.1:3000',
            '181.176.161.39:8080',
            '201.229.250.21:80',
            '45.230.8.20:999',
            '186.103.130.91:8080',
            '190.107.237.18:999',
            '45.175.239.25:999',
            '45.184.155.5:999',
            '216.10.27.159:6837:tjvkqvhu:i19g24kyvwo2'
        ];
    }

    simplifyError(errorMsg) {
        if (errorMsg.includes('ECONNREFUSED')) return 'Connection refused';
        if (errorMsg.includes('ETIMEDOUT')) return 'Connection timeout';
        if (errorMsg.includes('ENOTFOUND')) return 'Host not found';
        if (errorMsg.includes('SOCKS')) return 'SOCKS connection failed';
        return errorMsg.length > 30 ? errorMsg.substring(0, 30) + '...' : errorMsg;
    }

    async scrapeProxies() {
        const allProxies = new Set();
        
        console.log('🔍 Scraping proxies TANPA TEST...');
        
        for (const source of this.sources) {
            try {
                const response = await axios.get(source, { 
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const proxies = this.parseProxies(response.data, source);
                proxies.forEach(proxy => {
                    allProxies.add(proxy);
                });
                
                console.log(`✅ ${this.getSourceName(source)}: ${proxies.length} proxies`);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`❌ ${this.getSourceName(source)}: ${error.message}`);
            }
        }
        
        return Array.from(allProxies);
    }

    parseProxies(data, source) {
        const proxies = new Set();
        const lines = data.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            let proxyType = 'http';
            if (source.includes('socks4') || source.includes('SOCKS4')) proxyType = 'socks4';
            if (source.includes('socks5') || source.includes('SOCKS5')) proxyType = 'socks5';
            if (source.includes('https')) proxyType = 'https';
            
            // 🆕 Pattern untuk IP:PORT:USER:PASS
            const authMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5}):([^:]+):(.+)$/);
            if (authMatch) {
                const formatted = `http://${authMatch[3]}:${authMatch[4]}@${authMatch[1]}:${authMatch[2]}`;
                proxies.add(formatted);
                continue;
            }
            
            // Pattern biasa IP:PORT
            const ipPortMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (ipPortMatch) {
                if (proxyType === 'http') {
                    proxies.add(`${ipPortMatch[1]}:${ipPortMatch[2]}`);
                } else {
                    proxies.add(`${proxyType}://${ipPortMatch[1]}:${ipPortMatch[2]}`);
                }
            }
        }
        
        return Array.from(proxies);
    }

    getSourceName(url) {
        const domain = url.split('/')[2];
        return domain || 'Unknown';
    }

    getRandomActiveProxy() {
        const activeArray = Array.from(this.activeProxies.keys());
        return activeArray.length > 0 ? activeArray[Math.floor(Math.random() * activeArray.length)] : null;
    }

    markProxyAsFailed(proxyUrl) {
        this.failedProxies.add(proxyUrl);
        this.activeProxies.delete(proxyUrl);
    }

    getStatus() {
        return {
            totalActive: this.activeProxies.size,
            totalFailed: this.failedProxies.size,
            message: '🔧 MODE TANPA TEST: Proxy akan di-test saat runtime'
        };
    }

    clearAllProxies() {
        this.activeProxies.clear();
        this.failedProxies.clear();
        console.log('🧹 Semua proxy cache telah dihapus');
    }
}

module.exports = ProxyScraper;
[file content end]