const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyScraper {
    constructor() {
        this.sources = [
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=all&timeout=10000&country=all',
            'https://www.proxy-list.download/api/v1/get?type=https',
            'https://www.proxy-list.download/api/v1/get?type=socks4',
            'https://www.proxy-list.download/api/v1/get?type=socks5',
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks4.txt',
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt',
            'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-https.txt',
            'https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS4_RAW.txt',
            'https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS5_RAW.txt',
            'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt'
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
                return new HttpsProxyAgent(`http://${proxyUrl}`);
        }
    }

    formatProxyUrl(proxyUrl) {
        const proxyType = this.detectProxyType(proxyUrl);
        
        if (proxyUrl.includes('://')) {
            return proxyUrl;
        }
        
        return `http://${proxyUrl}`;
    }

    async basicPingTest(proxyUrl, timeout = 20000) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({ 
                    proxy: proxyUrl, 
                    working: false, 
                    error: 'Timeout (20s)',
                    testedAt: new Date() 
                });
            }, timeout);

            try {
                const agent = this.createProxyAgent(proxyUrl);
                const startTime = Date.now();
                
                const response = await axios.get('https://www.google.com', {
                    httpsAgent: agent,
                    timeout: 18000,
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
                    status: response.status,
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

    async getWorkingProxies(maxProxies = 15) {
        console.log('🎯 Mengambil proxy (HTTP/HTTPS/SOCKS) dengan basic ping test...');
        
        const now = Date.now();
        const cachedProxies = Array.from(this.activeProxies.entries())
            .filter(([proxy, data]) => now - data.lastTested < 300000)
            .map(([proxy]) => proxy)
            .slice(0, maxProxies);
            
        if (cachedProxies.length >= maxProxies) {
            console.log(`✅ Menggunakan ${cachedProxies.length} cached proxies`);
            return cachedProxies;
        }
        
        const allProxies = await this.scrapeProxies();
        
        if (allProxies.length === 0) {
            console.log('⚠️ Tidak ada proxy baru, menggunakan backup...');
            return this.getBackupProxies().slice(0, maxProxies);
        }
        
        console.log(`🔍 Basic ping test ${Math.min(allProxies.length, 25)} proxies...`);
        
        const testResults = [];
        const testSample = allProxies.slice(0, 25);

        const testPromises = testSample.map(proxy => 
            this.basicPingTest(proxy, 20000)
        );
        
        const results = await Promise.all(testPromises);
        testResults.push(...results);
        
        const workingProxies = testResults
            .filter(result => {
                if (result.working) {
                    console.log(`🟢 ${result.proxy} - ${result.proxyType.toUpperCase()} AKTIF (${result.responseTime}ms)`);
                    this.activeProxies.set(result.proxy, {
                        ip: this.extractIP(result.proxy),
                        speed: result.responseTime,
                        lastTested: now,
                        quality: result.responseTime > 10000 ? 'LAMBAT' : 'STANDARD',
                        type: result.proxyType
                    });
                    return true;
                } else {
                    console.log(`🔴 ${result.proxy} - ${result.proxyType.toUpperCase()} GAGAL: ${result.error}`);
                    this.failedProxies.add(result.proxy);
                    return false;
                }
            })
            .map(result => result.proxy);
        
        console.log(`✅ ${workingProxies.length} proxy aktif ditemukan`);
        
        const httpProxies = workingProxies.filter(p => this.detectProxyType(p) === 'http');
        const httpsProxies = workingProxies.filter(p => this.detectProxyType(p) === 'https');
        const socksProxies = workingProxies.filter(p => this.detectProxyType(p).includes('socks'));
        
        console.log(`📊 Klasifikasi: HTTP: ${httpProxies.length}, HTTPS: ${httpsProxies.length}, SOCKS: ${socksProxies.length}`);
        
        if (workingProxies.length < maxProxies) {
            const needed = maxProxies - workingProxies.length;
            const backupProxies = this.getBackupProxies().slice(0, needed);
            console.log(`🔄 Menambah ${backupProxies.length} backup proxies`);
            
            backupProxies.forEach(proxy => {
                this.activeProxies.set(proxy, {
                    ip: this.extractIP(proxy),
                    speed: 30000,
                    lastTested: now,
                    quality: 'BACKUP',
                    type: this.detectProxyType(proxy)
                });
            });
            workingProxies.push(...backupProxies);
        }
        
        return workingProxies.slice(0, maxProxies);
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
            'socks4://45.184.155.3:999',
            'socks4://190.97.233.18:999',
            'socks5://51.158.68.133:8811',
            'socks5://51.158.68.133:8888',
            'socks5://54.37.160.88:1080',
            'socks5://54.37.160.89:1080'
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
        
        console.log('🔍 Scraping proxies (HTTP/HTTPS/SOCKS)...');
        
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
                    if (!this.failedProxies.has(proxy)) {
                        allProxies.add(proxy);
                    }
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
            
            const ipPortMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (ipPortMatch) {
                if (proxyType === 'http') {
                    proxies.add(`${ipPortMatch[1]}:${ipPortMatch[2]}`);
                } else {
                    proxies.add(`${proxyType}://${ipPortMatch[1]}:${ipPortMatch[2]}`);
                }
            }
            
            const protocolMatch = trimmed.match(/^(https?|socks[45]):\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (protocolMatch) {
                proxies.add(trimmed);
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

    getProxyByType(type) {
        const proxies = Array.from(this.activeProxies.entries())
            .filter(([proxy, data]) => data.type === type)
            .map(([proxy]) => proxy);
        
        return proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;
    }

    markProxyAsFailed(proxyUrl) {
        this.failedProxies.add(proxyUrl);
        this.activeProxies.delete(proxyUrl);
    }

    getStatus() {
        const activeArray = Array.from(this.activeProxies.entries());
        const httpCount = activeArray.filter(([_, data]) => data.type === 'http').length;
        const httpsCount = activeArray.filter(([_, data]) => data.type === 'https').length;
        const socksCount = activeArray.filter(([_, data]) => data.type.includes('socks')).length;
        
        return {
            activeProxies: activeArray.map(([proxy, data]) => ({
                proxy,
                ip: data.ip,
                speed: data.speed,
                quality: data.quality,
                type: data.type,
                lastTested: new Date(data.lastTested).toLocaleTimeString()
            })),
            totalActive: this.activeProxies.size,
            totalFailed: this.failedProxies.size,
            byType: {
                http: httpCount,
                https: httpsCount,
                socks: socksCount
            }
        };
    }

    clearAllProxies() {
        this.activeProxies.clear();
        this.failedProxies.clear();
        console.log('🧹 Semua proxy cache telah dihapus');
    }
}

module.exports = ProxyScraper;