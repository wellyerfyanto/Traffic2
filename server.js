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
    version: '2.4.1',
    features: [
      'Native Proxy Solution (Stable)',
      'Extended Adaptive Timeout System', 
      'Multi-Protocol Proxy (HTTP/HTTPS/SOCKS)',
      'Extended User Agent Database',
      'Proxy Speed Classification',
      'Real-time Proxy Analytics',
      'Auto-Loop System',
      'Real-time Monitoring'
    ],
    system: {
      proxyMethod: 'native-browser-proxy',
      maxTimeout: '240 seconds',
      minTimeout: '45 seconds',
      userAgents: '50+ variants',
      retryMechanism: '3 attempts with fresh browser'
    }
  });
});


// Start Session Endpoint
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

        console.log('🚀 Starting session dengan puppeteer-page-proxy:', {
            targetUrl: config.targetUrl,
            profileCount: config.profileCount,
            deviceType: config.deviceType,
            proxySource: config.proxySource,
            proxyCount: config.proxyList ? config.proxyList.length : 0,
            backupCount: config.backupProxies ? config.backupProxies.length : 0,
            autoLoop: config.isAutoLoop
        });

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started dengan puppeteer-page-proxy system',
            details: {
                sessionId,
                targetUrl: config.targetUrl,
                profiles: config.profileCount,
                deviceType: config.deviceType,
                proxySource: config.proxySource,
                verifiedProxies: config.proxyList ? config.proxyList.length : 0,
                features: ['Puppeteer-Page-Proxy', 'Extended Timeout', 'Quick-Switch Technology']
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Session creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Pastikan sistem proxy bekerja dengan baik',
            suggestion: 'Cek koneksi internet dan format proxy yang digunakan'
        });
    }
});

// Test Single Proxy Endpoint
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
                stepMultiplier: result.stepMultiplier ? result.stepMultiplier + 'x' : 'N/A',
                puppeteerFormat: trafficBot.formatProxyForPageProxy(proxyUrl)
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

// Bulk Test Proxies Endpoint
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
        
        const ultraFastCount = results.filter(r => r.working && r.speedCategory === 'ULTRA_FAST').length;
        const fastCount = results.filter(r => r.working && r.speedCategory === 'FAST').length;
        const mediumCount = results.filter(r => r.working && r.speedCategory === 'MEDIUM').length;
        const slowCount = results.filter(r => r.working && r.speedCategory === 'SLOW').length;
        const verySlowCount = results.filter(r => r.working && r.speedCategory === 'VERY_SLOW').length;
        const extremelySlowCount = results.filter(r => r.working && r.speedCategory === 'EXTREMELY_SLOW').length;
        
        res.json({ 
            success: true, 
            results,
            summary: {
                total: results.length,
                working: working,
                failed: failed,
                successRate: ((working / results.length) * 100).toFixed(1) + '%',
                bySpeed: {
                    ultra_fast: ultraFastCount,
                    fast: fastCount,
                    medium: mediumCount,
                    slow: slowCount,
                    very_slow: verySlowCount,
                    extremely_slow: extremelySlowCount
                },
                byType: {
                    http: results.filter(r => r.working && r.proxyType === 'http').length,
                    https: results.filter(r => r.working && r.proxyType === 'https').length,
                    socks: results.filter(r => r.working && r.proxyType.includes('socks')).length
                },
                recommendation: working > 0 ? 
                    `Gunakan ${ultraFastCount > 0 ? 'ULTRA_FAST' : fastCount > 0 ? 'FAST' : mediumCount > 0 ? 'MEDIUM' : 'SLOW'} proxies untuk performa terbaik` :
                    'Tidak ada proxy yang bekerja'
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

// Proxy Speed Analysis Endpoint
app.get('/api/proxy-speed-analysis', (req, res) => {
    try {
        const status = trafficBot.getProxyStatus();
        
        const speedAnalysis = {
            ultra_fast: status.activeProxies.filter(p => p.speedCategory === 'ULTRA_FAST').length,
            fast: status.activeProxies.filter(p => p.speedCategory === 'FAST').length,
            medium: status.activeProxies.filter(p => p.speedCategory === 'MEDIUM').length,
            slow: status.activeProxies.filter(p => p.speedCategory === 'SLOW').length,
            very_slow: status.activeProxies.filter(p => p.speedCategory === 'VERY_SLOW').length,
            extremely_slow: status.activeProxies.filter(p => p.speedCategory === 'EXTREMELY_SLOW').length,
            total: status.totalActive
        };
        
        const averageSpeed = status.activeProxies.length > 0 ? 
            status.activeProxies.reduce((sum, p) => sum + p.speed, 0) / status.activeProxies.length : 0;
        
        res.json({ 
            success: true, 
            speedAnalysis,
            performance: {
                averageSpeed: Math.round(averageSpeed) + 'ms',
                totalActive: status.totalActive,
                totalFailed: status.totalFailed,
                successRate: status.totalActive > 0 ? 
                    ((status.totalActive / (status.totalActive + status.totalFailed)) * 100).toFixed(1) + '%' : '0%'
            },
            recommendedSettings: {
                ultra_fast: 'Timeout: 45s - Excellent',
                fast: 'Timeout: 60s - Very Good', 
                medium: 'Timeout: 90s - Good',
                slow: 'Timeout: 120s - Acceptable',
                very_slow: 'Timeout: 180s - Slow',
                extremely_slow: 'Timeout: 240s - Very Slow'
            },
            activeProxies: status.activeProxies.map(p => ({
                proxy: p.proxy,
                speed: p.speed + 'ms',
                category: p.speedCategory,
                timeout: p.optimalTimeout/1000 + 's',
                stepMultiplier: p.stepMultiplier + 'x',
                type: p.type,
                quality: p.quality,
                lastTested: p.lastTested
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get Proxies by Type Endpoint
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
            type: type,
            speedDistribution: {
                ultra_fast: filteredProxies.filter(p => p.speedCategory === 'ULTRA_FAST').length,
                fast: filteredProxies.filter(p => p.speedCategory === 'FAST').length,
                medium: filteredProxies.filter(p => p.speedCategory === 'MEDIUM').length,
                slow: filteredProxies.filter(p => p.speedCategory === 'SLOW').length,
                very_slow: filteredProxies.filter(p => p.speedCategory === 'VERY_SLOW').length,
                extremely_slow: filteredProxies.filter(p => p.speedCategory === 'EXTREMELY_SLOW').length
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

// User Agents Count Endpoint
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

// Auto-Loop Status Endpoint
app.get('/api/auto-loop/status', (req, res) => {
    const sessions = trafficBot.getAllSessions();
    const activeSessions = sessions.filter(s => s.status === 'running').length;
    
    const proxyStatus = trafficBot.getProxyStatus();
    const activeProxies = proxyStatus.totalActive;
    
    res.json({
        success: true,
        activeSessions,
        totalSessions: sessions.length,
        proxyStatus: {
            activeProxies: activeProxies,
            totalProxies: activeProxies + proxyStatus.totalFailed
        },
        config: {
            enabled: trafficBot.autoRestartEnabled,
            interval: 30 * 60 * 1000,
            maxSessions: 5,
            targetUrl: 'https://github.com',
            proxySource: 'auto'
        },
        performance: {
            successRate: sessions.length > 0 ? 
                ((sessions.filter(s => s.status === 'running').length / sessions.length) * 100).toFixed(1) + '%' : '0%',
            averageProxiesPerSession: sessions.length > 0 ?
                (sessions.reduce((sum, s) => sum + (s.proxyCount || 0), 0) / sessions.length).toFixed(1) : 0
        },
        timestamp: new Date().toISOString()
    });
});

// Start Auto-Loop Endpoint
app.post('/api/auto-loop/start', (req, res) => {
    try {
        trafficBot.setAutoRestart(true);
        res.json({ 
            success: true, 
            message: 'Auto-loop started dengan puppeteer-page-proxy system',
            features: [
                'Quick-Switch Proxy Technology',
                'Extended Adaptive Timeout',
                'Automatic Proxy Rotation',
                'Real-time Performance Monitoring'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stop Auto-Loop Endpoint
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

// Get All Sessions Endpoint
app.get('/api/all-sessions', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        
        const performanceStats = {
            total: sessions.length,
            running: sessions.filter(s => s.status === 'running').length,
            stopped: sessions.filter(s => s.status === 'stopped').length,
            error: sessions.filter(s => s.status === 'error').length,
            successRate: sessions.length > 0 ? 
                ((sessions.filter(s => s.status === 'running').length / sessions.length) * 100).toFixed(1) + '%' : '0%',
            averageProxies: sessions.length > 0 ?
                (sessions.reduce((sum, s) => sum + (s.proxyCount || 0), 0) / sessions.length).toFixed(1) : 0,
            autoLoopSessions: sessions.filter(s => s.isAutoLoop).length
        };
        
        res.json({ 
            success: true, 
            sessions,
            performance: performanceStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get Session Logs Endpoint
app.get('/api/session-logs/:sessionId', (req, res) => {
    try {
        const logs = trafficBot.getSessionLogs(req.params.sessionId);
        const session = trafficBot.getAllSessions().find(s => s.id === req.params.sessionId);
        
        res.json({ 
            success: true, 
            logs,
            sessionInfo: session || null,
            totalEntries: logs.length,
            sessionId: req.params.sessionId,
            errorLogs: logs.filter(log => log.step.includes('ERROR') || log.step.includes('FAILED')),
            proxyLogs: logs.filter(log => log.step.includes('PROXY')),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stop Specific Session Endpoint
app.post('/api/stop-session/:sessionId', (req, res) => {
    try {
        trafficBot.stopSession(req.params.sessionId);
        res.json({ 
            success: true, 
            message: 'Session stopped',
            sessionId: req.params.sessionId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stop All Sessions Endpoint
app.post('/api/stop-all-sessions', (req, res) => {
    try {
        const sessionsBefore = trafficBot.getAllSessions().length;
        trafficBot.stopAllSessions();
        const sessionsAfter = trafficBot.getAllSessions().filter(s => s.status === 'running').length;
        
        res.json({ 
            success: true, 
            message: 'All sessions stopped',
            stoppedCount: sessionsBefore - sessionsAfter,
            remainingSessions: sessionsAfter,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Clear All Sessions Endpoint
app.post('/api/clear-sessions', (req, res) => {
    try {
        const sessionsCount = trafficBot.getAllSessions().length;
        const logsCount = Array.from(trafficBot.sessionLogs.keys()).length;
        
        trafficBot.clearAllSessions();
        
        res.json({ 
            success: true, 
            message: 'All sessions and logs cleared',
            cleared: {
                sessions: sessionsCount,
                logs: logsCount
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

// Test Puppeteer Endpoint
app.get('/api/test-puppeteer', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const version = await browser.version();
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer is working correctly dengan new headless mode',
            systemInfo: {
                chromePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'Default',
                chromeVersion: version,
                nodeVersion: process.version,
                platform: process.platform,
                puppeteerPageProxy: 'INSTALLED'
            },
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

// Proxy Status Endpoint
app.get('/api/proxy-status', (req, res) => {
    try {
        const status = trafficBot.getProxyStatus();
        
        const speedSummary = {
            ultra_fast: status.activeProxies.filter(p => p.speedCategory === 'ULTRA_FAST').length,
            fast: status.activeProxies.filter(p => p.speedCategory === 'FAST').length,
            medium: status.activeProxies.filter(p => p.speedCategory === 'MEDIUM').length,
            slow: status.activeProxies.filter(p => p.speedCategory === 'SLOW').length,
            very_slow: status.activeProxies.filter(p => p.speedCategory === 'VERY_SLOW').length,
            extremely_slow: status.activeProxies.filter(p => p.speedCategory === 'EXTREMELY_SLOW').length
        };
        
        const averageSpeed = status.activeProxies.length > 0 ? 
            status.activeProxies.reduce((sum, p) => sum + p.speed, 0) / status.activeProxies.length : 0;
            
        const averageTimeout = status.activeProxies.length > 0 ? 
            status.activeProxies.reduce((sum, p) => sum + p.optimalTimeout, 0) / status.activeProxies.length : 0;
        
        res.json({ 
            success: true, 
            status,
            summary: {
                totalActive: status.totalActive,
                totalFailed: status.totalFailed,
                successRate: status.totalActive > 0 ? 
                    ((status.totalActive / (status.totalActive + status.totalFailed)) * 100).toFixed(1) + '%' : '0%',
                averageSpeed: Math.round(averageSpeed) + 'ms',
                averageTimeout: Math.round(averageTimeout/1000) + 's',
                byType: status.byType,
                bySpeed: speedSummary,
                recommendation: speedSummary.ultra_fast > 0 ? 
                    'Gunakan ULTRA_FAST proxies untuk performa terbaik' :
                    speedSummary.fast > 0 ? 'Gunakan FAST proxies' :
                    speedSummary.medium > 0 ? 'Gunakan MEDIUM proxies' :
                    'Pertimbangkan untuk mencari proxy yang lebih cepat'
            },
            testMethod: 'Extended Adaptive Timeout Proxy Test',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// System Information Endpoint
app.get('/api/system-info', (req, res) => {
    try {
        const userAgents = trafficBot.userAgents;
        const proxyStatus = trafficBot.getProxyStatus();
        const sessions = trafficBot.getAllSessions();
        
        res.json({
            success: true,
            system: {
                version: '2.4.0',
                proxyMethod: 'puppeteer-page-proxy',
                timeoutRange: '45s - 240s',
                userAgents: {
                    desktop: userAgents.desktop.length,
                    mobile: userAgents.mobile.length,
                    total: userAgents.desktop.length + userAgents.mobile.length
                },
                features: [
                    'Quick-Switch Proxy Technology',
                    'Extended Adaptive Timeout',
                    'Multi-Protocol Support',
                    'Auto Proxy Testing',
                    'Real-time Analytics'
                ]
            },
            currentStatus: {
                activeSessions: sessions.filter(s => s.status === 'running').length,
                totalSessions: sessions.length,
                activeProxies: proxyStatus.totalActive,
                failedProxies: proxyStatus.totalFailed,
                autoLoopEnabled: trafficBot.autoRestartEnabled
            },
            performance: {
                sessionSuccessRate: sessions.length > 0 ? 
                    ((sessions.filter(s => s.status === 'running').length / sessions.length) * 100).toFixed(1) + '%' : '0%',
                proxySuccessRate: proxyStatus.totalActive > 0 ? 
                    ((proxyStatus.totalActive / (proxyStatus.totalActive + proxyStatus.totalFailed)) * 100).toFixed(1) + '%' : '0%'
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

// Main Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint tidak ditemukan',
        availableEndpoints: [
            'GET  /health',
            'POST /api/start-session',
            'GET  /api/proxy-speed-analysis',
            'GET  /api/user-agents/count',
            'GET  /api/system-info',
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
        ],
        timestamp: new Date().toISOString()
    });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// ... (semua endpoint lainnya tetap sama seperti sebelumnya)

app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Traffic Bot Server v2.4.1`);
    console.log(`=========================================`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log(`🔧 Health: http://localhost:${PORT}/health`);
    console.log(`📊 Monitor: http://localhost:${PORT}/monitoring`);
    
    console.log(`\n⚡ System Features:`);
    console.log(`   🔌 Proxy: Native Browser Proxy (Stable)`);
    console.log(`   ⏱️  Timeout: Extended Adaptive (45s - 4m)`);
    console.log(`   👤 User Agents: 50+ Desktop & Mobile Variants`);
    console.log(`   📈 Analytics: Real-time Performance Monitoring`);
    
    console.log(`\n📋 Environment Info:`);
    console.log(`   Node.js: ${process.version}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Chrome: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Bundled'}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Port: ${PORT}`);
    
    console.log(`\n🎯 Ready to generate traffic dengan NATIVE PROXY SOLUTION!`);
    console.log(`=========================================\n`);
});

module.exports = app;
