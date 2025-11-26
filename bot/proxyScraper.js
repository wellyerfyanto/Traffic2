const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ProxyScraper {
    constructor() {
        this.sources = [
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://www.proxy-list.download/api/v1/get?type=https',
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
            'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
            'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
            'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
            'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt'
        ];
        this.testUrl = 'https://crptoajah.blogspot.com';
        this.activeProxies = new Set();
        this.failedProxies = new Set();
    }

    async scrapeProxies() {
        const allProxies = new Set();
        
        console.log('🔍 Mulai scraping proxies dari berbagai sumber...');
        
        for (const source of this.sources) {
            try {
                const response = await axios.get(source, { timeout: 15000 });
                const proxies = this.parseProxies(response.data);
                
                proxies.forEach(proxy => {
                    if (!this.failedProxies.has(proxy)) {
                        allProxies.add(proxy);
                    }
                });
                console.log(`✅ ${source}: ${proxies.length} proxies ditemukan`);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`❌ Gagal dari ${source}: ${error.message}`);
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
            
            const ipPortMatch = trimmed.match(/^(\d+\.\d+\.\d+\.\d+):(\d+)$/);
            if (ipPortMatch) {
                proxies.add(`${ipPortMatch[1]}:${ipPortMatch[2]}`);
                continue;
            }
            
            const httpMatch = trimmed.match(/^https?:\/\/(\d+\.\d+\.\d+\.\d+):(\d+)/);
            if (httpMatch) {
                proxies.add(`${httpMatch[1]}:${httpMatch[2]}`);
                continue;
            }
            
            const authMatch = trimmed.match(/^(\d+\.\d+\.\d+\.\d+):(\d+):([^:]+):(.+)$/);
            if (authMatch) {
                proxies.add(`${authMatch[1]}:${authMatch[2]}`);
            }
        }
        
        return Array.from(proxies);
    }

    async testProxy(proxyUrl, timeout = 15000) {
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({ proxy: proxyUrl, working: false, error: 'Timeout', testedAt: new Date() });
            }, timeout);

            try {
                const agent = new HttpsProxyAgent(`http://${proxyUrl}`);
                const startTime = Date.now();
                
                const response = await axios.get(this.testUrl, {
                    httpsAgent: agent,
                    timeout: timeout - 1000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    validateStatus: function (status) {
                        return status >= 200 && status < 500;
                    }
                });
                
                const responseTime = Date.now() - startTime;
                clearTimeout(timeoutId);
                
                if (response.status >= 200 && response.status < 400 && responseTime < 10000) {
                    resolve({ 
                        proxy: proxyUrl, 
                        working: true, 
                        responseTime: responseTime,
                        status: response.status,
                        testedAt: new Date()
                    });
                } else {
                    resolve({ 
                        proxy: proxyUrl, 
                        working: false, 
                        error: `Status: ${response.status}, Time: ${responseTime}ms`,
                        testedAt: new Date()
                    });
                }
                
            } catch (error) {
                clearTimeout(timeoutId);
                resolve({ 
                    proxy: proxyUrl, 
                    working: false, 
                    error: error.message,
                    testedAt: new Date()
                });
            }
        });
    }

    async getWorkingProxies(maxProxies = 10) {
        console.log('🎯 Mengambil dan testing proxies ke Blogspot...');
        
        const currentActive = Array.from(this.activeProxies);
        if (currentActive.length >= maxProxies) {
            console.log(`✅ Menggunakan ${currentActive.length} proxy aktif dari cache`);
            return currentActive.slice(0, maxProxies);
        }
        
        const allProxies = await this.scrapeProxies();
        console.log(`📥 Total ${allProxies.length} proxies ditemukan, mulai testing...`);
        
        const testResults = [];
        const batchSize = 8;
        const testSample = allProxies.slice(0, 100);

        for (let i = 0; i < testSample.length; i += batchSize) {
            const batch = testSample.slice(i, i + batchSize);
            const batchPromises = batch.map(proxy => 
                this.testProxy(proxy, 12000)
            );
            
            const batchResults = await Promise.all(batchPromises);
            testResults.push(...batchResults);
            
            const workingCount = testResults.filter(r => r.working).length;
            console.log(`⏳ Progress: ${i + batch.length}/${testSample.length} - ${workingCount} working`);
            
            if (workingCount >= maxProxies) {
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const workingProxies = testResults
            .filter(result => {
                if (result.working) {
                    return true;
                } else {
                    this.failedProxies.add(result.proxy);
                    return false;
                }
            })
            .sort((a, b) => a.responseTime - b.responseTime)
            .map(result => result.proxy);
        
        workingProxies.forEach(proxy => this.activeProxies.add(proxy));
        
        const uniqueProxies = Array.from(new Set(workingProxies));
        
        console.log(`✅ ${uniqueProxies.length} working proxies ditemukan dan disimpan`);
        
        return uniqueProxies.slice(0, maxProxies);
    }

    addManualProxies(proxyList) {
        proxyList.forEach(proxy => {
            if (proxy && proxy.includes(':') && !this.failedProxies.has(proxy)) {
                this.activeProxies.add(proxy);
            }
        });
        console.log(`✅ ${proxyList.length} proxy manual ditambahkan`);
    }

    getRandomActiveProxy() {
        const activeArray = Array.from(this.activeProxies);
        if (activeArray.length === 0) {
            return null;
        }
        return activeArray[Math.floor(Math.random() * activeArray.length)];
    }

    markProxyAsFailed(proxyUrl) {
        this.failedProxies.add(proxyUrl);
        this.activeProxies.delete(proxyUrl);
        console.log(`🗑️ Proxy ditandai gagal: ${proxyUrl}`);
    }

    getStatus() {
        return {
            activeProxies: Array.from(this.activeProxies),
            failedProxies: Array.from(this.failedProxies),
            totalActive: this.activeProxies.size,
            totalFailed: this.failedProxies.size
        };
    }

    clearAllProxies() {
        this.activeProxies.clear();
        this.failedProxies.clear();
        console.log('🧹 Semua proxy telah dihapus');
    }
}

module.exports = ProxyScraper;
