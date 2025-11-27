const express = require('express');
const path = require('path');
const TrafficGenerator = require('./bot/trafficGenerator.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const trafficBot = new TrafficGenerator();

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'GitHub Traffic Bot',
    version: '2.3.0',
    features: [
      'Adaptive Timeout Proxy System',
      'Multi-Protocol Proxy (HTTP/HTTPS/SOCKS)',
      'Extended User Agent Database', 
      'Proxy Speed Classification',
      'New Headless Mode',
      'Real-time Monitoring'
    ]
  });
});

// Endpoint yang sudah ada sebelumnya...
app.post('/api/start-session', async (req, res) => {
    try {
        const { targetUrl, profiles, deviceType, proxySource, proxies, proxyCount, autoLoop, backupProxies } = req.body;
        
        if (!targetUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Target URL wajib diisi' 
            });
        }

        try {
            new URL(targetUrl);
        } catch (e) {
            return res.status(400).json({ 
                success: false, 
                error: 'Format URL tidak valid' 
            });
        }

        const config = {
            targetUrl,
            profileCount: parseInt(profiles) || 1,
            deviceType: deviceType || 'desktop',
            proxySource: proxySource || 'manual',
            proxyList: proxies || [],
            proxyCount: parseInt(proxyCount) || 5,
            isAutoLoop: autoLoop || false,
            backupProxies: backupProxies || [],
            maxRestarts: 3
        };

        console.log('Starting session dengan adaptive timeout config:', {
            targetUrl: config.targetUrl,
            profileCount: config.profileCount,
            proxySource: config.proxySource,
            proxyCount: config.proxyList ? config.proxyList.length : 0,
            backupCount: config.backupProxies ? config.backupProxies.length : 0
        });

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started dengan adaptive timeout proxy system',
            details: {
                sessionId,
                proxySource: config.proxySource,
                verifiedProxies: config.proxyList ? config.proxyList.length : 0,
                features: ['Adaptive Timeout', 'Extended User Agents', 'Proxy Speed Classification']
            }
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Pastikan sistem proxy bekerja dengan baik'
        });
    }
});

// Endpoint baru untuk analisis kecepatan proxy
app.get('/api/proxy-speed-analysis', (req, res) => {
    try {
        const status = trafficBot.getProxyStatus();
        
        // Analisis kecepatan proxy
        const speedAnalysis = {
            fast: status.activeProxies.filter(p => p.speedCategory === 'FAST').length,
            medium: status.activeProxies.filter(p => p.speedCategory === 'MEDIUM').length,
            slow: status.activeProxies.filter(p => p.speedCategory === 'SLOW').length,
            verySlow: status.activeProxies.filter(p => p.speedCategory === 'VERY_SLOW').length,
            total: status.totalActive
        };
        
        res.json({ 
            success: true, 
            speedAnalysis,
            recommendedSettings: {
                fast: 'Timeout: 30s - Optimal',
                medium: 'Timeout: 45s - Good', 
                slow: 'Timeout: 60s - Acceptable',
                verySlow: 'Timeout: 90s - Slow Connection'
            },
            activeProxies: status.activeProxies.map(p => ({
                proxy: p.proxy,
                speed: p.speed + 'ms',
                category: p.speedCategory,
                timeout: p.optimalTimeout/1000 + 's',
                type: p.type,
                quality: p.quality
            }))
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint untuk mendapatkan info user agents
app.get('/api/user-agents/count', (req, res) => {
    try {
        const userAgents = trafficBot.userAgents;
        res.json({
            success: true,
            counts: {
                desktop: userAgents.desktop.length,
                mobile: userAgents.mobile.length,
                total: userAgents.desktop.length + userAgents.mobile.length
            },
            sample: {
                desktop: userAgents.desktop[0],
                mobile: userAgents.mobile[0]
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint yang sudah ada sebelumnya (test-proxy, bulk-test-proxies, dll)...
app.post('/api/test-proxy', async (req, res) => {
    try {
        const { proxyUrl } = req.body;
        
        if (!proxyUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Proxy URL required' 
            });
        }

        const result = await trafficBot.proxyScraper.basicPingTest(proxyUrl);
        
        res.json({ 
            success: true, 
            result,
            proxyInfo: {
                originalUrl: proxyUrl,
                formattedUrl: trafficBot.proxyScraper.formatProxyUrl(proxyUrl),
                type: trafficBot.proxyScraper.detectProxyType(proxyUrl),
                speedCategory: result.speedCategory,
                optimalTimeout: result.optimalTimeout ? result.optimalTimeout/1000 + 's' : 'N/A',
                puppeteerFormat: trafficBot.formatProxyForPuppeteer(proxyUrl)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/bulk-test-proxies', async (req, res) => {
    try {
        const { proxies } = req.body;
        
        if (!proxies || !Array.isArray(proxies)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Proxies array required' 
            });
        }

        if (proxies.length > 50) {
            return res.status(400).json({ 
                success: false, 
                error: 'Maximum 50 proxies per test' 
            });
        }

        const testPromises = proxies.map(proxy => 
            trafficBot.proxyScraper.basicPingTest(proxy)
        );
        const results = await Promise.all(testPromises);
        
        const working = results.filter(r => r.working).length;
        const failed = results.filter(r => !r.working).length;
        
        const fastCount = results.filter(r => r.working && r.speedCategory === 'FAST').length;
        const mediumCount = results.filter(r => r.working && r.speedCategory === 'MEDIUM').length;
        const slowCount = results.filter(r => r.working && r.speedCategory === 'SLOW').length;
        const verySlowCount = results.filter(r => r.working && r.speedCategory === 'VERY_SLOW').length;
        
        res.json({ 
            success: true, 
            results,
            summary: {
                total: results.length,
                working: working,
                failed: failed,
                successRate: ((working / results.length) * 100).toFixed(1) + '%',
                bySpeed: {
                    fast: fastCount,
                    medium: mediumCount,
                    slow: slowCount,
                    verySlow: verySlowCount
                },
                byType: {
                    http: results.filter(r => r.working && r.proxyType === 'http').length,
                    https: results.filter(r => r.working && r.proxyType === 'https').length,
                    socks: results.filter(r => r.working && r.proxyType.includes('socks')).length
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ... (endpoint lainnya tetap sama)

app.get('/api/proxies/by-type/:type', (req, res) => {
    try {
        const { type } = req.params;
        const status = trafficBot.getProxyStatus();
        
        const filteredProxies = status.activeProxies.filter(proxy => 
            proxy.type === type.toLowerCase()
        );
        
        res.json({ 
            success: true, 
            proxies: filteredProxies,
            count: filteredProxies.length,
            type: type
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/auto-loop/status', (req, res) => {
    const sessions = trafficBot.getAllSessions();
    const activeSessions = sessions.filter(s => s.status === 'running').length;
    
    res.json({
        success: true,
        activeSessions,
        totalSessions: sessions.length,
        config: {
            enabled: trafficBot.autoRestartEnabled,
            interval: 30 * 60 * 1000,
            maxSessions: 5,
            targetUrl: 'https://github.com',
            proxySource: 'auto'
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auto-loop/start', (req, res) => {
    try {
        trafficBot.setAutoRestart(true);
        res.json({ 
            success: true, 
            message: 'Auto-loop started dengan adaptive timeout proxy system',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/auto-loop/stop', (req, res) => {
    try {
        trafficBot.setAutoRestart(false);
        trafficBot.stopAllSessions();
        res.json({ 
            success: true, 
            message: 'Auto-loop stopped dan semua sessions dihentikan',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/all-sessions', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        res.json({ 
            success: true, 
            sessions,
            total: sessions.length,
            running: sessions.filter(s => s.status === 'running').length,
            stopped: sessions.filter(s => s.status === 'stopped').length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/session-logs/:sessionId', (req, res) => {
    try {
        const logs = trafficBot.getSessionLogs(req.params.sessionId);
        res.json({ 
            success: true, 
            logs,
            totalEntries: logs.length,
            sessionId: req.params.sessionId
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/stop-session/:sessionId', (req, res) => {
    try {
        trafficBot.stopSession(req.params.sessionId);
        res.json({ 
            success: true, 
            message: 'Session stopped',
            sessionId: req.params.sessionId
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/stop-all-sessions', (req, res) => {
    try {
        trafficBot.stopAllSessions();
        res.json({ 
            success: true, 
            message: 'All sessions stopped',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/clear-sessions', (req, res) => {
    try {
        trafficBot.clearAllSessions();
        res.json({ 
            success: true, 
            message: 'All sessions and logs cleared',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/test-puppeteer', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer is working correctly dengan new headless mode',
            chromePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'Default',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            suggestion: 'Pastikan Chromium terinstall dan environment variable PUPPETEER_EXECUTABLE_PATH sudah diset'
        });
    }
});

app.get('/api/proxy-status', (req, res) => {
    try {
        const status = trafficBot.getProxyStatus();
        res.json({ 
            success: true, 
            status,
            summary: {
                totalActive: status.totalActive,
                totalFailed: status.totalFailed,
                byType: status.byType,
                bySpeed: {
                    fast: status.activeProxies.filter(p => p.speedCategory === 'FAST').length,
                    medium: status.activeProxies.filter(p => p.speedCategory === 'MEDIUM').length,
                    slow: status.activeProxies.filter(p => p.speedCategory === 'SLOW').length,
                    verySlow: status.activeProxies.filter(p => p.speedCategory === 'VERY_SLOW').length
                },
                testMethod: 'Adaptive Timeout Proxy Test'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint tidak ditemukan',
        availableEndpoints: [
            'GET  /health',
            'POST /api/start-session',
            'GET  /api/proxy-speed-analysis',
            'GET  /api/user-agents/count',
            'GET  /api/auto-loop/status',
            'POST /api/auto-loop/start',
            'POST /api/auto-loop/stop',
            'GET  /api/all-sessions',
            'GET  /api/session-logs/:sessionId',
            'POST /api/stop-session/:sessionId',
            'POST /api/stop-all-sessions',
            'POST /api/clear-sessions',
            'GET  /api/test-puppeteer',
            'GET  /api/proxy-status',
            'POST /api/test-proxy',
            'POST /api/bulk-test-proxies',
            'GET  /api/proxies/by-type/:type'
        ]
    });
});

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log(`🔒 System: ADAPTIVE TIMEOUT PROXY (HTTP/HTTPS/SOCKS4/SOCKS5)`);
    console.log(`🎯 Auto-Detect: Protocol detection + Speed classification`);
    console.log(`👤 User Agents: ${trafficBot.userAgents.desktop.length + trafficBot.userAgents.mobile.length} variants`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Monitoring: http://localhost:${PORT}/monitoring`);
    
    console.log(`\n📋 System Information:`);
    console.log(`   Node.js: ${process.version}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Chrome: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Bundled'}`);
    console.log(`   Headless Mode: NEW`);
    console.log(`   Proxy Support: HTTP, HTTPS, SOCKS4, SOCKS5`);
    console.log(`   Adaptive Timeout: ✅ ENABLED`);
    console.log(`   User Agent Variants: Desktop ${trafficBot.userAgents.desktop.length}, Mobile ${trafficBot.userAgents.mobile.length}`);
    console.log(`   Puppeteer Integration: ✅ FIXED`);
});