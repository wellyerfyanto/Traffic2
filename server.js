const express = require('express');
const path = require('path');
const TrafficGenerator = require('./trafficGenerator.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const trafficBot = new TrafficGenerator();

// Auto-loop configuration
let autoLoopConfig = {
    enabled: false,
    interval: 30 * 60 * 1000,
    maxSessions: 5,
    targetUrl: '',
    proxySource: 'auto'
};

let autoLoopInterval = null;

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Advanced Traffic Bot',
        version: '4.0.0',
        features: [
            'Puppeteer Full Support',
            'Advanced Google Ads Detection',
            'Human Behavior Simulation',
            'Multi-Proxy System',
            'Auto-Loop Sessions',
            'Real-time Monitoring'
        ]
    });
});

// Start Session Endpoint
app.post('/api/start-session', async (req, res) => {
    try {
        const { targetUrl, profiles, deviceType, proxySource, proxies, proxyCount, autoLoop } = req.body;
        
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
            isAutoLoop: autoLoop || false
        };

        console.log('🚀 Starting session:', {
            targetUrl: config.targetUrl,
            profileCount: config.profileCount,
            deviceType: config.deviceType,
            proxySource: config.proxySource,
            proxyCount: config.proxyList ? config.proxyList.length : 0
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
                proxySource: config.proxySource
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
        const { interval, maxSessions, targetUrl, proxySource, proxies, proxyCount } = req.body;
        
        if (!targetUrl) {
            return res.status(400).json({
                success: false,
                error: 'Target URL wajib diisi untuk auto-loop'
            });
        }

        autoLoopConfig = {
            enabled: true,
            interval: interval || 30 * 60 * 1000,
            maxSessions: maxSessions || 5,
            targetUrl: targetUrl,
            proxySource: proxySource || 'auto',
            proxyList: proxies || [],
            proxyCount: proxyCount || 5
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
                        deviceType: Math.random() > 0.5 ? 'desktop' : 'mobile',
                        proxySource: autoLoopConfig.proxySource,
                        proxyList: autoLoopConfig.proxyList,
                        proxyCount: autoLoopConfig.proxyCount,
                        isAutoLoop: true
                    };
                    
                    await trafficBot.startNewSession(config);
                    console.log(`🔄 Auto-loop: Started new session untuk ${config.targetUrl}`);
                } catch (error) {
                    console.error('❌ Auto-loop error:', error.message);
                }
            }
        }, autoLoopConfig.interval);

        res.json({ 
            success: true, 
            message: `Auto-loop started dengan interval ${autoLoopConfig.interval/60000} menit`,
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
            message: 'Auto-loop stopped dan semua sessions dihentikan'
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

// System Info
app.get('/api/system-info', (req, res) => {
    try {
        const proxyStatus = trafficBot.getProxyStatus();
        const sessions = trafficBot.getAllSessions();
        
        res.json({
            success: true,
            system: {
                version: '4.0.0',
                puppeteer: 'Full Version',
                features: 'Advanced Ads Detection'
            },
            currentStatus: {
                activeSessions: sessions.filter(s => s.status === 'running').length,
                totalSessions: sessions.length,
                activeProxies: proxyStatus.totalActive || 0
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
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });
        
        const version = await browser.version();
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer Full is working correctly',
            version: version,
            type: 'Full Version',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'Bundled Chromium'
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
    console.log(`\n🚀 Advanced Traffic Bot Server v4.0.0`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`⚡ Puppeteer: FULL VERSION`);
    console.log(`🎯 Focus: Google Ads Detection & Interaction`);
    console.log(`🔧 Auto-Loop: SUPPORTED\n`);
});