const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ProxyScraper {
    constructor() {
        this.sources = [
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
            'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt',
            'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt'
        ];
        
        this.activeProxies = new Map(); // {proxy: {ip, speed, lastTested, quality}}
        this.failedProxies = new Set();
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
                const agent = new HttpsProxyAgent(`http://${proxyUrl}`);
                const startTime = Date.now();
                
                // Cukup test koneksi dasar ke Google - tidak perlu validasi detail
                const response = await axios.get('https://www.google.com', {
                    httpsAgent: agent,
                    timeout: 18000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    validateStatus: function () {
                        // Terima semua status code - yang penting proxy merespons
                        return true;
                    }
                });
                
                const responseTime = Date.now() - startTime;
                clearTimeout(timeoutId);
                
                // KRITERIA SANGAT SEDERHANA: Proxy dianggap bekerja jika bisa connect
                // Tidak peduli status code atau response time
                resolve({ 
                    proxy: proxyUrl, 
                    working: true, 
                    responseTime: responseTime,
                    status: response.status,
                    testedAt: new Date()
                });
                
            } catch (error) {
                clearTimeout(timeoutId);
                resolve({ 
                    proxy: proxyUrl, 
                    working: false, 
                    error: this.simplifyError(error.message),
                    testedAt: new Date()
                });
            }
        });
    }

    async getWorkingProxies(maxProxies = 10) {
        console.log('🎯 Mengambil proxy dengan basic ping test...');
        
        // Prioritaskan cache yang masih valid (dalam 5 menit)
        const now = Date.now();
        const cachedProxies = Array.from(this.activeProxies.entries())
            .filter(([proxy, data]) => now - data.lastTested < 300000) // 5 menit
            .map(([proxy]) => proxy)
            .slice(0, maxProxies);
            
        if (cachedProxies.length >= maxProxies) {
            console.log(`✅ Menggunakan ${cachedProxies.length} cached proxies`);
            return cachedProxies;
        }
        
        // Scrape proxies baru
        const allProxies = await this.scrapeProxies();
        
        if (allProxies.length === 0) {
            console.log('⚠️ Tidak ada proxy baru, menggunakan backup...');
            return this.getBackupProxies().slice(0, maxProxies);
        }
        
        console.log(`🔍 Basic ping test ${Math.min(allProxies.length, 20)} proxies...`);
        
        const testResults = [];
        const testSample = allProxies.slice(0, 20); // Test maksimal 20 proxy

        // Test semua proxy secara parallel
        const testPromises = testSample.map(proxy => 
            this.basicPingTest(proxy, 20000)
        );
        
        const results = await Promise.all(testPromises);
        testResults.push(...results);
        
        // Filter proxy yang bekerja - KRITERIA SANGAT LONGGA
        const workingProxies = testResults
            .filter(result => {
                if (result.working) {
                    console.log(`🟢 ${result.proxy} - AKTIF (${result.responseTime}ms)`);
                    // Simpan ke cache aktif
                    this.activeProxies.set(result.proxy, {
                        ip: result.proxy.split(':')[0],
                        speed: result.responseTime,
                        lastTested: now,
                        quality: result.responseTime > 10000 ? 'LAMBAT' : 'STANDARD'
                    });
                    return true;
                } else {
                    console.log(`🔴 ${result.proxy} - GAGAL: ${result.error}`);
                    this.failedProxies.add(result.proxy);
                    return false;
                }
            })
            .map(result => result.proxy);
        
        console.log(`✅ ${workingProxies.length} proxy aktif ditemukan`);
        
        // Jika masih kurang, tambahkan backup proxies
        if (workingProxies.length < maxProxies) {
            const needed = maxProxies - workingProxies.length;
            const backupProxies = this.getBackupProxies().slice(0, needed);
            console.log(`🔄 Menambah ${backupProxies.length} backup proxies`);
            
            // Asumsikan backup proxies bekerja tanpa test (atau kita bisa test dulu jika mau)
            backupProxies.forEach(proxy => {
                this.activeProxies.set(proxy, {
                    ip: proxy.split(':')[0],
                    speed: 30000, // Default speed untuk backup
                    lastTested: now,
                    quality: 'BACKUP'
                });
            });
            workingProxies.push(...backupProxies);
        }
        
        return workingProxies.slice(0, maxProxies);
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
            '45.184.155.3:999',
            '190.97.233.18:999'
        ];
    }

    simplifyError(errorMsg) {
        if (errorMsg.includes('ECONNREFUSED')) return 'Connection refused';
        if (errorMsg.includes('ETIMEDOUT')) return 'Connection timeout';
        if (errorMsg.includes('ENOTFOUND')) return 'Host not found';
        return errorMsg.length > 30 ? errorMsg.substring(0, 30) + '...' : errorMsg;
    }

    async scrapeProxies() {
        const allProxies = new Set();
        
        console.log('🔍 Scraping proxies...');
        
        for (const source of this.sources) {
            try {
                const response = await axios.get(source, { 
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const proxies = this.parseProxies(response.data);
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

    parseProxies(data) {
        const proxies = new Set();
        const lines = data.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const ipPortMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (ipPortMatch) {
                proxies.add(ipPortMatch[0]);
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
            activeProxies: Array.from(this.activeProxies.entries()).map(([proxy, data]) => ({
                proxy,
                ip: data.ip,
                speed: data.speed,
                quality: data.quality,
                lastTested: new Date(data.lastTested).toLocaleTimeString()
            })),
            totalActive: this.activeProxies.size,
            totalFailed: this.failedProxies.size
        };
    }

    clearAllProxies() {
        this.activeProxies.clear();
        this.failedProxies.clear();
        console.log('🧹 Semua proxy cache telah dihapus');
    }
}

module.exports = ProxyScraper;