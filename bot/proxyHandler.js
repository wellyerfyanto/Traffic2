class ProxyHandler {
    constructor() {
        this.proxyList = [];
    }

    addManualProxy(proxyString) {
        if (proxyString && proxyString.includes(':')) {
            const trimmedProxy = proxyString.trim();
            this.proxyList.push(trimmedProxy);
            console.log(`✅ Proxy manual ditambahkan: ${trimmedProxy}`);
            return true;
        }
        console.error('❌ Format proxy salah. Gunakan format: ip:port');
        return false;
    }

    addMultipleProxies(proxyArray) {
        if (Array.isArray(proxyArray)) {
            proxyArray.forEach(proxy => {
                if (proxy && proxy.includes(':')) {
                    this.proxyList.push(proxy.trim());
                }
            });
            console.log(`✅ ${proxyArray.length} proxy ditambahkan`);
        }
    }

    getRandomProxy() {
        if (this.proxyList.length === 0) {
            return null;
        }
        const randomProxy = this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
        return {
            ip: randomProxy.split(':')[0],
            port: randomProxy.split(':')[1],
            url: `http://${randomProxy}`
        };
    }

    getAllProxies() {
        return this.proxyList;
    }

    clearProxies() {
        this.proxyList = [];
        console.log('🧹 Semua proxy telah dihapus');
    }

    validateProxyFormat(proxyString) {
        if (!proxyString || !proxyString.includes(':')) {
            return false;
        }
        const parts = proxyString.split(':');
        if (parts.length !== 2) return false;
        
        const ip = parts[0];
        const port = parseInt(parts[1]);
        
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        
        if (isNaN(port) || port < 1 || port > 65535) return false;
        
        return true;
    }
}

module.exports = ProxyHandler;