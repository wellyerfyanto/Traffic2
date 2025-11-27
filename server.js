const express = require('express');
const path = require('path');
const TrafficGenerator = require('./bot/trafficGenerator.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const trafficBot = new TrafficGenerator();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'GitHub Traffic Bot',
    version: '2.0.0',
    features: [
      'Comprehensive Proxy Testing',
      'Multiple Fallback Systems', 
      'Real-time Monitoring',
      'Auto-loop Sessions',
      'Stealth Browsing'
    ]
  });
});

// Start session endpoint
app.post('/api/start-session', async (req, res) => {
    try {
        const { targetUrl, profiles, deviceType, proxySource, proxies, proxyCount, autoLoop, backupProxies } = req.body;
        
        // Validasi target URL
        if (!targetUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Target URL wajib diisi' 
            });
        }

        // Validasi format URL
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

        console.log('Starting session dengan config:', {
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
            message: 'Session started dengan comprehensive proxy testing',
            details: {
                sessionId,
                proxySource: config.proxySource,
                verifiedProxies: config.proxyList ? config.proxyList.length : 0
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

// Auto-loop endpoints
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
            message: 'Auto-loop started dengan proxy system',
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

// Session management endpoints
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

// System testing endpoints
app.get('/api/test-puppeteer', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer is working correctly',
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
                testServices: status.testServices
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Proxy testing endpoints
app.post('/api/test-proxy', async (req, res) => {
    try {
        const { proxyUrl } = req.body;
        
        if (!proxyUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'Proxy URL required' 
            });
        }

        const result = await trafficBot.proxyScraper.testProxyDetailed(proxyUrl);
        
        res.json({ 
            success: true, 
            result,
            timestamp: new Date().toISOString()
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

        const results = await trafficBot.proxyScraper.bulkTestProxies(proxies);
        
        const working = results.filter(r => r.working).length;
        const failed = results.filter(r => !r.working).length;
        
        res.json({ 
            success: true, 
            results,
            summary: {
                total: results.length,
                working: working,
                failed: failed,
                successRate: ((working / results.length) * 100).toFixed(1) + '%'
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

// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint tidak ditemukan',
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
            'POST /api/clear-sessions',
            'GET  /api/test-puppeteer',
            'GET  /api/proxy-status',
            'POST /api/test-proxy',
            'POST /api/bulk-test-proxies'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log(`🔒 System: COMPREHENSIVE PROXY TESTING ENABLED`);
    console.log(`🎯 Test Services: IPAPI, HTTPBIN, IPINFO`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Monitoring: http://localhost:${PORT}/monitoring`);
    
    // System info
    console.log(`\n📋 System Information:`);
    console.log(`   Node.js: ${process.version}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Chrome: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Bundled'}`);
    console.log(`   Proxy Test: Comprehensive Multi-Service`);
});