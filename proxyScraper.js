const axios = require('axios');

class ProxyScraper {
    constructor() {
        this.sources = [
            'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all',
            'https://www.proxy-list.download/api/v1/get?type=http',
            'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt'
        ];
    }

    async getProxiesWithoutTest(maxProxies = 10) {
        console.log('🎯 Getting proxies WITHOUT pre-test...');
        
        const allProxies = [];
        
        for (const source of this.sources) {
            try {
                const response = await axios.get(source, { 
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                
                const proxies = this.parseProxies(response.data);
                allProxies.push(...proxies);
                
                console.log(`✅ ${this.getSourceName(source)}: ${proxies.length} proxies`);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`❌ ${this.getSourceName(source)}: ${error.message}`);
            }
        }
        
        const uniqueProxies = [...new Set(allProxies)];
        console.log(`✅ Total unique proxies: ${uniqueProxies.length}`);
        
        return uniqueProxies.slice(0, maxProxies);
    }

    parseProxies(data) {
        const proxies = new Set();
        const lines = data.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const ipPortMatch = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
            if (ipPortMatch) {
                proxies.add(`${ipPortMatch[1]}:${ipPortMatch[2]}`);
            }
        }
        
        return Array.from(proxies);
    }

    getSourceName(url) {
        const domain = url.split('/')[2];
        return domain || 'Unknown';
    }

    getBackupProxies() {
        return [
            '103.147.247.1:3000',
            '181.176.161.39:8080', 
            '201.229.250.21:80',
            '45.230.8.20:999',
            '186.103.130.91:8080',
            '190.107.237.18:999',
            '45.175.239.25:999'
        ];
    }
}

module.exports = ProxyScraper;