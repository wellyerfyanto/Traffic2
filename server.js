const express = require('express');
const path = require('path');
const TrafficGenerator = require('./bot/trafficGenerator.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const trafficBot = new TrafficGenerator();

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'GitHub Traffic Bot',
    version: '2.5.0',
    features: [
      'AUTO-SWITCH PROXY SYSTEM',
      'NO PROXY TEST (Direct Use)',
      '60s Timeout Auto-Switch',
      'Quick Session Execution'
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

        console.log('🚀 Starting session dengan AUTO-SWITCH PROXY...');

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started dengan AUTO-SWITCH PROXY system',
            features: ['No Proxy Test', 'Auto-Switch 60s', 'Quick Execution']
        });
    } catch (error) {
        console.error('❌ Session creation error:', error);
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

// Get Session Logs Endpoint
app.get('/api/session-logs/:sessionId', (req, res) => {
    try {
        const logs = trafficBot.getSessionLogs(req.params.sessionId);
        
        res.json({ 
            success: true, 
            logs,
            totalEntries: logs.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stop Session Endpoint
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

// Stop All Sessions Endpoint
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

// Clear All Sessions Endpoint
app.post('/api/clear-sessions', (req, res) => {
    try {
        trafficBot.clearAllSessions();
        res.json({ 
            success: true, 
            message: 'All sessions and logs cleared'
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
                platform: process.platform
            }
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
        
        res.json({ 
            success: true, 
            status,
            message: '🔧 AUTO-SWITCH PROXY SYSTEM - Proxy akan di-switch otomatis jika timeout'
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
            'GET  /api/all-sessions',
            'GET  /api/session-logs/:sessionId',
            'POST /api/stop-session/:sessionId',
            'POST /api/stop-all-sessions',
            'POST /api/clear-sessions',
            'GET  /api/test-puppeteer',
            'GET  /api/proxy-status'
        ]
    });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 GitHub Traffic Bot Server v2.5.0`);
    console.log(`=========================================`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log(`🔧 Health: http://localhost:${PORT}/health`);
    console.log(`📊 Monitor: http://localhost:${PORT}/monitoring`);
    
    console.log(`\n⚡ System Features:`);
    console.log(`   🔌 Proxy: AUTO-SWITCH SYSTEM`);
    console.log(`   ⏱️  Timeout: 60 detik auto-switch`);
    console.log(`   🔄 Retry: Auto switch proxy`);
    console.log(`   🚀 Execution: Quick mode`);
    
    console.log(`\n🎯 Ready dengan AUTO-SWITCH PROXY!`);
    console.log(`=========================================\n`);
});

module.exports = app;