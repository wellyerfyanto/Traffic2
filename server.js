const express = require('express');
const path = require('path');
const TrafficGenerator = require('./trafficGenerator.js'); // Fixed path

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const trafficBot = new TrafficGenerator();

// Auto-loop configuration
let autoLoopConfig = {
    enabled: false,
    interval: 30 * 60 * 1000, // 30 minutes
    maxSessions: 5,
    targetUrl: 'https://github.com',
    proxySource: 'auto'
};

let autoLoopInterval = null;

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'GitHub Traffic Bot',
        version: '2.4.1',
        features: [
            'Native Proxy Solution',
            'Extended Adaptive Timeout System', 
            'Multi-Protocol Proxy (HTTP/HTTPS/SOCKS)',
            'Extended User Agent Database',
            'Proxy Speed Classification',
            'Real-time Proxy Analytics',
            'Auto-Loop System',
            'Real-time Monitoring'
        ]
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

        console.log('🚀 Starting session:', {
            targetUrl: config.targetUrl,
            profileCount: config.profileCount,
            deviceType: config.deviceType,
            proxySource: config.proxySource,
            proxyCount: config.proxyList ? config.proxyList.length : 0,
            autoLoop: config.isAutoLoop
        });

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started successfully',
            details: {
                sessionId,
                targetUrl: config.targetUrl,
                profiles: config.profileCount,
                deviceType: config.deviceType,
                proxySource: config.proxySource,
                verifiedProxies: config.proxyList ? config.proxyList.length : 0
            }
        });
    } catch (error) {
        console.error('❌ Session creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// Auto-Loop Endpoints
app.get('/api/auto-loop/status', (req, res) => {
    const sessions = trafficBot.getAllSessions();
    const activeSessions = sessions.filter(s => s.status === 'running').length;
    
    res.json({
        success: true,
        activeSessions,
        totalSessions: sessions.length,
        config: autoLoopConfig,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auto-loop/start', (req, res) => {
    try {
        const { interval, maxSessions, targetUrl, proxySource, proxies } = req.body;
        
        autoLoopConfig = {
            enabled: true,
            interval: interval || 30 * 60 * 1000,
            maxSessions: maxSessions || 5,
            targetUrl: targetUrl || 'https://github.com',
            proxySource: proxySource || 'auto',
            proxyList: proxies || []
        };

        // Stop existing interval
        if (autoLoopInterval) {
            clearInterval(autoLoopInterval);
        }

        // Start new interval
        autoLoopInterval = setInterval(async () => {
            if (!autoLoopConfig.enabled) return;
            
            const sessions = trafficBot.getAllSessions();
            const runningSessions = sessions.filter(s => s.status === 'running').length;
            
            if (runningSessions < autoLoopConfig.maxSessions) {
                try {
                    const config = {
                        targetUrl: autoLoopConfig.targetUrl,
                        profileCount: 1,
                        deviceType: 'desktop',
                        proxySource: autoLoopConfig.proxySource,
                        proxyList: autoLoopConfig.proxyList,
                        isAutoLoop: true
                    };
                    
                    await trafficBot.startNewSession(config);
                    console.log(`🔄 Auto-loop: Started new session`);
                } catch (error) {
                    console.error('❌ Auto-loop error:', error.message);
                }
            }
        }, autoLoopConfig.interval);

        res.json({ 
            success: true, 
            message: `Auto-loop started with ${autoLoopConfig.interval/60000} minute interval`,
            config: autoLoopConfig
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
        autoLoopConfig.enabled = false;
        if (autoLoopInterval) {
            clearInterval(autoLoopInterval);
            autoLoopInterval = null;
        }
        
        trafficBot.stopAllSessions();
        
        res.json({ 
            success: true, 
            message: 'Auto-loop stopped and all sessions terminated'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Monitoring Endpoints
app.get('/api/all-sessions', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        
        res.json({ 
            success: true, 
            sessions,
            timestamp: new Date().toISOString()
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
            message: 'Session stopped'
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
            message: 'All sessions stopped'
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
            message: 'All sessions cleared'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Proxy Testing Endpoints
app.post('/api/test-proxy-ip', async (req, res) => {
    try {
        const { proxyUrl } = req.body;
        
        if (!proxyUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Proxy URL required' 
            });
        }

        const result = await trafficBot.proxyScraper.testProxyWithIPCheck(proxyUrl, 30000);
        
        res.json({ 
            success: true, 
            result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/proxy-speed-analysis', (req, res) => {
    try {
        const status = trafficBot.getProxyStatus();
        
        const speedAnalysis = {
            ultra_fast: status.activeProxies.filter(p => p.speedCategory === 'ULTRA_FAST').length,
            fast: status.activeProxies.filter(p => p.speedCategory === 'FAST').length,
            medium: status.activeProxies.filter(p => p.speedCategory === 'MEDIUM').length,
            slow: status.activeProxies.filter(p => p.speedCategory === 'SLOW').length,
            very_slow: status.activeProxies.filter(p => p.speedCategory === 'VERY_SLOW').length,
            total: status.totalActive
        };
        
        res.json({ 
            success: true, 
            speedAnalysis,
            performance: {
                totalActive: status.totalActive,
                totalFailed: status.totalFailed
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Puppeteer Test Endpoint
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
            message: 'Puppeteer is working correctly',
            chromeVersion: version
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// System Info
app.get('/api/system-info', (req, res) => {
    try {
        const userAgents = trafficBot.userAgents;
        const proxyStatus = trafficBot.getProxyStatus();
        const sessions = trafficBot.getAllSessions();
        
        res.json({
            success: true,
            system: {
                version: '2.4.1',
                userAgents: {
                    desktop: userAgents.desktop.length,
                    mobile: userAgents.mobile.length
                }
            },
            currentStatus: {
                activeSessions: sessions.filter(s => s.status === 'running').length,
                totalSessions: sessions.length,
                activeProxies: proxyStatus.totalActive
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Traffic Bot Server v2.4.1`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`⚡ Features: Multi-Proxy, Auto-Loop, Real-time Monitoring\n`);
});