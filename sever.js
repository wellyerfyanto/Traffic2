const express = require('express');
const path = require('path');
const TrafficGenerator = require('./trafficGenerator.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));

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

// Enhanced Health Check dengan Puppeteer status
app.get('/health', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        // Test Puppeteer availability
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            timeout: 180000, // ✅ Increased timeout
            protocolTimeout: 180000 // ✅ Added protocol timeout
        });
        
        const version = await browser.version();
        await browser.close();

        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'Advanced Traffic Bot - Railway Optimized',
            version: '4.3.0',
            puppeteer: {
                status: 'WORKING',
                version: version,
                chromium: process.env.PUPPETEER_EXECUTABLE_PATH || 'system'
            },
            environment: process.env.NODE_ENV || 'development',
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            error: 'Puppeteer test failed',
            message: error.message,
            suggestion: 'Check Chromium installation on Railway'
        });
    }
});

// Enhanced Start Session Endpoint
app.post('/api/start-session', async (req, res) => {
    try {
        console.log('📦 Received start session request:', {
            targetUrl: req.body.targetUrl ? '***' : 'missing',
            profiles: req.body.profiles,
            deviceType: req.body.deviceType,
            proxySource: req.body.proxySource
        });

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

        console.log('🚀 Starting session with config:', {
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
            message: 'Session started successfully dengan enhanced timeout system',
            details: {
                sessionId,
                targetUrl: config.targetUrl,
                profiles: config.profileCount,
                deviceType: config.deviceType,
                proxySource: config.proxySource,
                timeoutSettings: {
                    browser: '180000ms',
                    protocol: '180000ms',
                    navigation: '150000ms'
                }
            }
        });
    } catch (error) {
        console.error('❌ Session creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Enhanced Auto-Loop Endpoints
app.get('/api/auto-loop/status', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        const activeSessions = sessions.filter(s => s.status === 'running').length;
        
        res.json({
            success: true,
            activeSessions,
            totalSessions: sessions.length,
            config: autoLoopConfig,
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
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

// Enhanced Monitoring Endpoints
app.get('/api/all-sessions', (req, res) => {
    try {
        const sessions = trafficBot.getAllSessions();
        
        res.json({ 
            success: true, 
            sessions,
            timestamp: new Date().toISOString(),
            totalCount: sessions.length
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
            sessionId: req.params.sessionId,
            logCount: logs.length
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

// Enhanced System Info
app.get('/api/system-info', (req, res) => {
    try {
        const proxyStatus = trafficBot.getProxyStatus();
        const sessions = trafficBot.getAllSessions();
        
        res.json({
            success: true,
            system: {
                version: '4.3.0',
                puppeteer: 'Extra + Stealth Version - Railway Optimized',
                features: 'Enhanced Timeout System + Protocol Timeout Handling'
            },
            currentStatus: {
                activeSessions: sessions.filter(s => s.status === 'running').length,
                totalSessions: sessions.length,
                activeProxies: proxyStatus.totalActive || 0,
                qualityProxies: proxyStatus.qualityProxies || 0
            },
            timeoutSettings: {
                browser: '180000ms',
                protocol: '180000ms',
                navigation: '150000ms',
                page: '120000ms'
            },
            environment: {
                node: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                chromium: process.env.PUPPETEER_EXECUTABLE_PATH || 'system'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Enhanced Puppeteer Test Endpoint
app.get('/api/test-puppeteer', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            timeout: 180000, // ✅ Increased timeout
            protocolTimeout: 180000 // ✅ Added protocol timeout
        });
        
        const version = await browser.version();
        const pages = await browser.pages();
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer Extra + Stealth is working correctly dengan Enhanced Timeout',
            version: version,
            type: 'Extra + Stealth Version - Enhanced Timeout',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'System Chromium',
            pages: pages.length,
            timeoutSettings: {
                browser: '180000ms',
                protocol: '180000ms'
            },
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('❌ Puppeteer test error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            suggestion: 'Check Chromium installation on Railway. Using: ' + (process.env.PUPPETEER_EXECUTABLE_PATH || 'default')
        });
    }
});

// Enhanced User Agents Endpoint
app.get('/api/user-agents/count', (req, res) => {
    try {
        const userAgents = {
            desktop: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            mobile: [
                'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
                'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
            ]
        };
        
        res.json({
            success: true,
            counts: {
                desktop: userAgents.desktop.length,
                mobile: userAgents.mobile.length,
                total: userAgents.desktop.length + userAgents.mobile.length
            },
            lastUpdated: '2025-01-01'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🆕 NEW: Enhanced Proxy Management Endpoint
app.get('/api/proxy-status', (req, res) => {
    try {
        const proxyStatus = trafficBot.getProxyStatus();
        const sessions = trafficBot.getAllSessions();
        
        res.json({
            success: true,
            proxyStatus: {
                total: proxyStatus.totalActive,
                quality: proxyStatus.qualityProxies,
                message: proxyStatus.message
            },
            sessions: {
                active: sessions.filter(s => s.status === 'running').length,
                total: sessions.length
            },
            timeoutSettings: {
                browser: '180000ms',
                protocol: '180000ms',
                navigation: '150000ms'
            },
            recommendations: [
                'Gunakan proxy dengan kualitas GOOD atau EXCELLENT',
                'Hindari proxy yang sangat lambat (POOR quality)',
                'Test proxy sebelum digunakan untuk session penting'
            ]
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 🆕 NEW: Enhanced Session Start dengan Proxy Pre-check
app.post('/api/start-session-enhanced', async (req, res) => {
    try {
        const { targetUrl, profiles, deviceType, proxySource, proxies, proxyCount } = req.body;
        
        // Pre-check proxies
        if (proxySource === 'manual' && proxies && proxies.length > 0) {
            console.log('🔍 Pre-checking manual proxies...');
            const validProxies = proxies.filter(proxy => {
                return trafficBot.proxyHandler.validateProxyFormat(proxy);
            });
            
            if (validProxies.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Tidak ada proxy manual yang valid. Periksa format proxy.'
                });
            }
        }

        // Continue dengan session start biasa
        const config = {
            targetUrl,
            profileCount: parseInt(profiles) || 1,
            deviceType: deviceType || 'desktop',
            proxySource: proxySource || 'manual',
            proxyList: proxies || [],
            proxyCount: parseInt(proxyCount) || 5,
            isAutoLoop: false
        };

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started dengan enhanced protocol timeout system',
            details: {
                protocolTimeout: '180000ms',
                navigationTimeout: '150000ms',
                browserTimeout: '180000ms',
                proxyPreCheck: 'completed'
            }
        });
    } catch (error) {
        console.error('❌ Enhanced session error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            suggestion: 'Coba gunakan proxy yang lebih cepat atau kurangi jumlah session'
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

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET  /health',
            'POST /api/start-session',
            'GET  /api/auto-loop/status',
            'POST /api/auto-loop/start',
            'POST /api/auto-loop/stop',
            'GET  /api/all-sessions',
            'GET  /api/session-logs/:sessionId',
            'POST /api/stop-session/:sessionId',
            'POST /api/stop-all-sessions',
            'GET  /api/system-info',
            'GET  /api/test-puppeteer',
            'GET  /api/user-agents/count',
            'GET  /api/proxy-status', // 🆕 NEW
            'POST /api/start-session-enhanced' // 🆕 NEW
        ]
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('🚨 Global error handler:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    trafficBot.stopAllSessions();
    if (autoLoopInterval) {
        clearInterval(autoLoopInterval);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    trafficBot.stopAllSessions();
    if (autoLoopInterval) {
        clearInterval(autoLoopInterval);
    }
    process.exit(0);
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Advanced Traffic Bot Server v4.3.0 - Enhanced Timeout System`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`⚡ Puppeteer: 24.15.0+ EXTRA + STEALTH + ENHANCED TIMEOUT`);
    console.log(`🎯 Focus: Protocol Timeout Handling & Proxy Quality Management`);
    console.log(`🔧 Auto-Loop: SUPPORTED`);
    console.log(`🕵️ Stealth: ENABLED`);
    console.log(`⏰ Timeout: Browser=180s, Protocol=180s, Navigation=150s`);
    console.log(`🏗️ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Chromium: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'System Default'}`);
    console.log(`📊 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);
    
    // Test Puppeteer on startup
    setTimeout(async () => {
        try {
            const puppeteer = require('puppeteer-extra');
            const StealthPlugin = require('puppeteer-extra-plugin-stealth');
            puppeteer.use(StealthPlugin());
            
            const browser = await puppeteer.launch({ 
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
                timeout: 180000, // ✅ Increased timeout
                protocolTimeout: 180000 // ✅ Added protocol timeout
            });
            const version = await browser.version();
            await browser.close();
            console.log(`✅ Puppeteer Ready dengan Enhanced Timeout: ${version}`);
        } catch (error) {
            console.log(`❌ Puppeteer Startup Test Failed: ${error.message}`);
        }
    }, 2000);
});