const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ProxyScraper {
    constructor() {
        // UPDATE: Sumber proxy yang lebih fresh dan terpercaya
        this.sources = [
            'https://advanced.name/freeproxy?type=http', // ✅ Sumber baru yang Anda sarankan
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://www.proxy-list.download/api/v1/get?type=https', 
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
            'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt',
            'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
            'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/proxy.txt',
            'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
            'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt',
            'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt'
        ];
        this.testUrl = 'https://crptoajah.blogspot.com';
        this.activeProxies = new Set();
        this.failedProxies = new Set();
    }

    async scrapeProxies() {
        const allProxies = new Set();
        
        console.log('🔍 Mulai scraping proxies dari sumber terbaru...');
        
        for (const source of this.sources) {
            try {
                const response = await axios.get(source, { 
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const proxies = this.parseProxies(response.data);
                
                proxies.forEach(proxy => {
                    if (!this.failedProxies.has(proxy)) {
                        allProxies.add(proxy);
                    }
                });
                console.log(`✅ ${this.getSourceName(source)}: ${proxies.length} proxies ditemukan`);
                
                await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 detik
                
            } catch (error) {
                console.log(`❌ Gagal dari ${this.getSourceName(source)}: ${error.message}`);
            }
        }
        
        console.log(`📊 Total ${allProxies.size} proxies berhasil di-scrape`);
        return Array.from(allProxies);
    }

    getSourceName(url) {
        const names = {
            'advanced.name': 'Advanced-Name',
            'proxyscrape.com': 'ProxyScrape', 
            'proxy-list.download': 'Proxy-List',
            'github.com/TheSpeedX': 'SpeedX-SOCKS',
            'github.com/jetkai': 'JetKai-List',
            'github.com/roosterkid': 'RoosterKid',
            'github.com/ShiftyTR': 'ShiftyTR',
            'github.com/hookzof': 'Hookzof',
            'github.com/mmpx12': 'MMPX12',
            'github.com/sunny9577': 'Sunny9577'
        };
        
        for (const [key, value] of Object.entries(names)) {
            if (url.includes(key)) return value;
        }
        return 'Unknown Source';
    }

    parseProxies(data) {
        const proxies = new Set();
        const lines = data.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Format: IP:PORT (paling umum)
            const ipPortMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (ipPortMatch) {
                proxies.add(`${ipPortMatch[1]}:${ipPortMatch[2]}`);
                continue;
            }
            
            // Format: http://IP:PORT
            const httpMatch = trimmed.match(/^https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})/);
            if (httpMatch) {
                proxies.add(`${httpMatch[1]}:${httpMatch[2]}`);
                continue;
            }
            
            // Format untuk advanced.name (biasanya JSON atau HTML)
            const advancedMatch = trimmed.match(/"ip":"(\d+\.\d+\.\d+\.\d+)","port":"(\d+)"/);
            if (advancedMatch) {
                proxies.add(`${advancedMatch[1]}:${advancedMatch[2]}`);
                continue;
            }
            
            // Format CSV: IP,Port,...
            const csvMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}),(\d{1,5})/);
            if (csvMatch) {
                proxies.add(`${csvMatch[1]}:${csvMatch[2]}`);
            }
        }
        
        return Array.from(proxies);
    }

    async testProxy(proxyUrl, timeout = 20000) {
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
                
                const response = await axios.get(this.testUrl, {
                    httpsAgent: agent,
                    timeout: 18000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive'
                    },
                    validateStatus: function (status) {
                        return status < 500; // Terima semua status kecuali server error
                    }
                });
                
                const responseTime = Date.now() - startTime;
                clearTimeout(timeoutId);
                
                // Kriteria proxy bekerja: response time < 15 detik dan status 200-399
                if (response.status >= 200 && response.status < 400 && responseTime < 15000) {
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
                        error: `HTTP ${response.status}, Time: ${responseTime}ms`,
                        testedAt: new Date()
                    });
                }
                
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

    simplifyError(errorMsg) {
        if (errorMsg.includes('ECONNREFUSED')) return 'Connection refused';
        if (errorMsg.includes('ETIMEDOUT')) return 'Connection timeout';
        if (errorMsg.includes('ENOTFOUND')) return 'Host not found';
        if (errorMsg.includes('ECONNRESET')) return 'Connection reset';
        if (errorMsg.includes('socket hang up')) return 'Socket hang up';
        return errorMsg.length > 50 ? errorMsg.substring(0, 50) + '...' : errorMsg;
    }

    async getWorkingProxies(maxProxies = 15) {
        console.log('🎯 Mengambil dan testing proxies ke Blogspot...');
        
        // Coba gunakan cache dulu
        const currentActive = Array.from(this.activeProxies);
        if (currentActive.length >= maxProxies) {
            console.log(`✅ Menggunakan ${currentActive.length} proxy aktif dari cache`);
            return currentActive.slice(0, maxProxies);
        }
        
        // Scrape proxies baru
        const allProxies = await this.scrapeProxies();
        
        if (allProxies.length === 0) {
            console.log('❌ Tidak ada proxy yang berhasil di-scrape');
            return [];
        }
        
        console.log(`🧪 Testing ${Math.min(allProxies.length, 50)} proxies...`);
        
        const testResults = [];
        const batchSize = 6; // Kurangi batch size untuk hindari rate limit
        const testSample = allProxies.slice(0, 50); // Test maksimal 50 proxy

        for (let i = 0; i < testSample.length; i += batchSize) {
            const batch = testSample.slice(i, i + batchSize);
            console.log(`🔍 Testing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
            
            const batchPromises = batch.map(proxy => 
                this.testProxy(proxy, 25000)
            );
            
            const batchResults = await Promise.all(batchPromises);
            testResults.push(...batchResults);
            
            const workingCount = testResults.filter(r => r.working).length;
            console.log(`📊 Progress: ${i + batch.length}/${testSample.length} - ${workingCount} working`);
            
            // Jika sudah cukup working proxies, stop testing
            if (workingCount >= maxProxies) {
                console.log(`✅ Sudah cukup ${workingCount} working proxies, stop testing`);
                break;
            }
            
            // Delay lebih lama antara batch
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Filter dan sort proxies yang bekerja
        const workingProxies = testResults
            .filter(result => {
                if (result.working) {
                    console.log(`🟢 ${result.proxy} - ${result.responseTime}ms`);
                    return true;
                } else {
                    this.failedProxies.add(result.proxy);
                    console.log(`🔴 ${result.proxy} - ${result.error}`);
                    return false;
                }
            })
            .sort((a, b) => a.responseTime - b.responseTime)
            .map(result => result.proxy);
        
        // Update cache
        workingProxies.forEach(proxy => this.activeProxies.add(proxy));
        
        console.log(`✅ ${workingProxies.length} working proxies ditemukan`);
        
        return workingProxies.slice(0, maxProxies);
    }

    // Method untuk menambah proxy manual
    addManualProxies(proxyList) {
        let addedCount = 0;
        proxyList.forEach(proxy => {
            if (proxy && proxy.includes(':') && !this.failedProxies.has(proxy)) {
                this.activeProxies.add(proxy.trim());
                addedCount++;
            }
        });
        console.log(`✅ ${addedCount} proxy manual ditambahkan ke cache`);
    }

    getRandomActiveProxy() {
        const activeArray = Array.from(this.activeProxies);
        if (activeArray.length === 0) {
            return null;
        }
        const randomProxy = activeArray[Math.floor(Math.random() * activeArray.length)];
        console.log(`🎲 Memilih proxy random: ${randomProxy}`);
        return randomProxy;
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
            totalFailed: this.failedProxies.size,
            sources: this.sources.length
        };
    }

    clearAllProxies() {
        this.activeProxies.clear();
        this.failedProxies.clear();
        console.log('🧹 Semua proxy cache telah dihapus');
    }
}

module.exports = ProxyScraper;
