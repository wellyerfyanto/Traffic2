// bot/proxyScraper.js - DENGAN TESTING YANG LEBIH AKURAT
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
        
        // LAYANAN TEST PROXY YANG AKURAT
        this.testServices = [
            {
                name: 'IPAPI',
                url: 'https://api.ipify.org?format=json',
                validator: (data) => data && data.ip && typeof data.ip === 'string'
            },
            {
                name: 'HTTPBIN',
                url: 'https://httpbin.org/ip', 
                validator: (data) => data && data.origin && typeof data.origin === 'string'
            },
            {
                name: 'IPINFO',
                url: 'https://ipinfo.io/json',
                validator: (data) => data && data.ip && data.country
            }
        ];
        
        this.activeProxies = new Map(); // {proxy: {ip, country, speed, lastTested}}
        this.failedProxies = new Set();
        this.testTimeout = 15000;
    }

    async testProxyWithService(proxyUrl, service) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({ 
                    working: false, 
                    error: `Timeout (${service.name})`,
                    service: service.name
                });
            }, this.testTimeout);

            try {
                const agent = new HttpsProxyAgent(`http://${proxyUrl}`);
                const startTime = Date.now();
                
                const response = await axios.get(service.url, {
                    httpsAgent: agent,
                    timeout: 12000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'application/json,text/html,*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                });

                const responseTime = Date.now() - startTime;
                clearTimeout(timeoutId);

                // Validasi response
                if (response.status === 200 && service.validator(response.data)) {
                    resolve({
                        working: true,
                        responseTime: responseTime,
                        data: response.data,
                        service: service.name,
                        ip: response.data.ip || response.data.origin
                    });
                } else {
                    resolve({
                        working: false,
                        error: `Invalid response from ${service.name}`,
                        service: service.name
                    });
                }

            } catch (error) {
                clearTimeout(timeoutId);
                resolve({
                    working: false,
                    error: this.simplifyError(error.message),
                    service: service.name
                });
            }
        });
    }

    async comprehensiveProxyTest(proxyUrl) {
        console.log(`🧪 Testing ${proxyUrl} dengan multiple services...`);
        
        const results = [];
        
        for (const service of this.testServices) {
            const result = await this.testProxyWithService(proxyUrl, service);
            results.push(result);
            
            // Jika satu service berhasil, kita anggap proxy bekerja
            if (result.working) {
                console.log(`✅ ${proxyUrl} bekerja via ${service.name} - ${result.responseTime}ms`);
                
                return {
                    proxy: proxyUrl,
                    working: true,
                    responseTime: result.responseTime,
                    ip: result.ip,
                    service: service.name,
                    testedAt: new Date()
                };
            }
            
            // Delay antar test service
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Jika semua service gagal
        const errors = results.map(r => `${r.service}: ${r.error}`).join(', ');
        console.log(`❌ ${proxyUrl} gagal semua test: ${errors}`);
        
        return {
            proxy: proxyUrl,
            working: false,
            error: errors,
            testedAt: new Date()
        };
    }

    async getWorkingProxies(maxProxies = 8) {
        console.log('🎯 Memulai comprehensive proxy testing...');
        
        // Cek cache aktif dulu
        const cachedProxies = Array.from(this.activeProxies.entries())
            .filter(([_, data]) => Date.now() - data.lastTested < 300000) // 5 menit
            .sort((a, b) => a[1].speed - b[1].speed)
            .slice(0, maxProxies)
            .map(([proxy]) => proxy);
            
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
        
        console.log(`🔍 Testing ${Math.min(allProxies.length, 25)} proxies...`);
        
        const testResults = [];
        const batchSize = 3; // Small batch untuk hindari rate limit
        
        for (let i = 0; i < Math.min(allProxies.length, 25); i += batchSize) {
            const batch = allProxies.slice(i, i + batchSize);
            console.log(`\n📦 Batch ${Math.floor(i/batchSize) + 1}: Testing ${batch.length} proxies`);
            
            const batchPromises = batch.map(proxy => 
                this.comprehensiveProxyTest(proxy)
            );
            
            const batchResults = await Promise.all(batchPromises);
            testResults.push(...batchResults);
            
            const workingCount = testResults.filter(r => r.working).length;
            console.log(`📊 Progress: ${i + batch.length}/25 - ${workingCount} working`);
            
            if (workingCount >= maxProxies) {
                console.log('✅ Target working proxies tercapai');
                break;
            }
            
            // Delay antara batch
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Process results
        const workingProxies = testResults
            .filter(result => {
                if (result.working) {
                    // Update cache
                    this.activeProxies.set(result.proxy, {
                        ip: result.ip,
                        speed: result.responseTime,
                        lastTested: Date.now(),
                        service: result.service
                    });
                    return true;
                } else {
                    this.failedProxies.add(result.proxy);
                    return false;
                }
            })
            .sort((a, b) => a.responseTime - b.responseTime)
            .map(result => result.proxy);
        
        console.log(`✅ ${workingProxies.length} working proxies ditemukan`);
        
        // Jika kurang dari target, tambahkan backup
        if (workingProxies.length < maxProxies) {
            const needed = maxProxies - workingProxies.length;
            const backupProxies = this.getBackupProxies().slice(0, needed);
            console.log(`🔄 Menambah ${backupProxies.length} backup proxies`);
            
            // Test backup proxies juga
            for (const backupProxy of backupProxies) {
                const result = await this.comprehensiveProxyTest(backupProxy);
                if (result.working) {
                    workingProxies.push(backupProxy);
                    this.activeProxies.set(backupProxy, {
                        ip: result.ip,
                        speed: result.responseTime,
                        lastTested: Date.now(),
                        service: result.service
                    });
                }
            }
        }
        
        return workingProxies.slice(0, maxProxies);
    }

    // METHOD BARU: Test proxy individual dengan detail
    async testProxyDetailed(proxyUrl) {
        return await this.comprehensiveProxyTest(proxyUrl);
    }

    // METHOD BARU: Bulk test untuk proxy manual
    async bulkTestProxies(proxyList) {
        console.log(`🧪 Bulk testing ${proxyList.length} manual proxies...`);
        
        const results = [];
        const batchSize = 2;
        
        for (let i = 0; i < proxyList.length; i += batchSize) {
            const batch = proxyList.slice(i, i + batchSize);
            
            const batchPromises = batch.map(proxy => 
                this.comprehensiveProxyTest(proxy)
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }

    getBackupProxies() {
        // Backup proxies yang sudah di-test dan bekerja
        return [
            '103.147.247.1:3000',
            '181.176.161.39:8080',
            '201.229.250.21:80', 
            '45.230.8.20:999',
            '186.103.130.91:8080',
            '190.107.237.18:999',
            '45.175.239.25:999',
            '45.184.155.5:999'
        ];
    }

    // Method helper tetap sama
    simplifyError(errorMsg) {
        if (errorMsg.includes('ECONNREFUSED')) return 'Connection refused';
        if (errorMsg.includes('ETIMEDOUT')) return 'Connection timeout';
        if (errorMsg.includes('ENOTFOUND')) return 'Host not found';
        if (errorMsg.includes('ECONNRESET')) return 'Connection reset';
        if (errorMsg.includes('socket hang up')) return 'Socket hang up';
        return errorMsg.length > 30 ? errorMsg.substring(0, 30) + '...' : errorMsg;
    }

    async scrapeProxies() {
        const allProxies = new Set();
        
        console.log('🔍 Scraping proxies dari berbagai sumber...');
        
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
            
            // Format IP:PORT
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
                lastTested: new Date(data.lastTested).toLocaleTimeString()
            })),
            totalActive: this.activeProxies.size,
            totalFailed: this.failedProxies.size,
            testServices: this.testServices.map(s => s.name)
        };
    }
}

module.exports = ProxyScraper;