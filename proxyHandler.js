[file name]: proxyHandler.js
[file content begin]
class ProxyHandler {
    constructor() {
        this.proxyList = [];
    }

    // Method untuk parsing proxy dengan format IP:PORT:USER:PASS
    parseProxyWithAuth(proxyString) {
        if (!proxyString || !proxyString.includes(':')) {
            return null;
        }
        
        const parts = proxyString.split(':');
        
        // Format: IP:PORT:USER:PASS
        if (parts.length === 4) {
            const ip = parts[0];
            const port = parts[1];
            const username = parts[2];
            const password = parts[3];
            
            // Validasi IP dan port
            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipRegex.test(ip)) return null;
            
            const portNum = parseInt(port);
            if (isNaN(portNum) || portNum < 1 || portNum > 65535) return null;
            
            return `http://${username}:${password}@${ip}:${port}`;
        }
        
        return null;
    }

    addManualProxy(proxyString) {
        // Coba parse sebagai proxy dengan auth
        const authProxy = this.parseProxyWithAuth(proxyString);
        if (authProxy) {
            this.proxyList.push(authProxy);
            console.log(`✅ Proxy dengan auth ditambahkan: ${authProxy}`);
            return true;
        }
        
        // Fallback ke format biasa
        if (proxyString && proxyString.includes(':')) {
            const trimmedProxy = proxyString.trim();
            this.proxyList.push(trimmedProxy);
            console.log(`✅ Proxy manual ditambahkan: ${trimmedProxy}`);
            return true;
        }
        
        console.error('❌ Format proxy salah. Gunakan format: ip:port atau ip:port:user:pass');
        return false;
    }

    addMultipleProxies(proxyArray) {
        if (Array.isArray(proxyArray)) {
            let addedCount = 0;
            proxyArray.forEach(proxy => {
                if (proxy && proxy.includes(':')) {
                    // Coba parse dengan auth, jika tidak berhasil gunakan format biasa
                    const authProxy = this.parseProxyWithAuth(proxy);
                    if (authProxy) {
                        this.proxyList.push(authProxy);
                        addedCount++;
                    } else {
                        this.proxyList.push(proxy.trim());
                        addedCount++;
                    }
                }
            });
            console.log(`✅ ${addedCount} proxy ditambahkan TANPA TEST AWAL`);
        }
    }

    getRandomProxy() {
        if (this.proxyList.length === 0) {
            return null;
        }
        const randomProxy = this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
        
        // Return dalam format yang sesuai untuk berbagai use case
        if (randomProxy.includes('@')) {
            // Format dengan auth: http://user:pass@ip:port
            const matches = randomProxy.match(/http:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
            if (matches) {
                return {
                    ip: matches[3],
                    port: matches[4],
                    username: matches[1],
                    password: matches[2],
                    url: randomProxy,
                    hasAuth: true
                };
            }
        }
        
        // Format biasa IP:PORT
        const parts = randomProxy.split(':');
        return {
            ip: parts[0],
            port: parts[1],
            url: `http://${randomProxy}`,
            hasAuth: false
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
        // Coba parse sebagai proxy dengan auth
        const authProxy = this.parseProxyWithAuth(proxyString);
        if (authProxy) {
            return true;
        }
        
        // Validasi format biasa
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

    // Method untuk mendapatkan proxy dalam format yang berbeda
    getFormattedProxy(proxyString) {
        const authProxy = this.parseProxyWithAuth(proxyString);
        if (authProxy) {
            return authProxy;
        }
        return `http://${proxyString}`;
    }

    // 🆕 Method untuk menghapus proxy yang gagal
    removeFailedProxy(proxyUrl) {
        const index = this.proxyList.indexOf(proxyUrl);
        if (index > -1) {
            this.proxyList.splice(index, 1);
            console.log(`🗑️ Proxy gagal dihapus: ${proxyUrl}`);
            return true;
        }
        return false;
    }

    // 🆕 Method untuk mendapatkan jumlah proxy tersisa
    getRemainingCount() {
        return this.proxyList.length;
    }
}

module.exports = ProxyHandler;
[file content end]