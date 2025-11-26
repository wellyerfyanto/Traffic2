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
    version: '2.0.0'
  });
});

app.post('/api/start-session', async (req, res) => {
    try {
        const { targetUrl, profiles, deviceType, proxySource, proxies, proxyCount, autoLoop } = req.body;
        
        const config = {
            targetUrl,
            profileCount: parseInt(profiles) || 1,
            deviceType: deviceType || 'desktop',
            proxySource: proxySource || 'manual',
            proxyList: proxies || [],
            proxyCount: parseInt(proxyCount) || 5,
            isAutoLoop: autoLoop || false
        };

        const sessionId = await trafficBot.startNewSession(config);
        
        res.json({ 
            success: true, 
            sessionId,
            message: 'Session started dengan proxy system'
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
        config: {
            enabled: trafficBot.autoRestartEnabled,
            interval: 30 * 60 * 1000,
            maxSessions: 5,
            targetUrl: 'https://github.com',
            proxySource: 'auto'
        }
    });
});

app.post('/api/auto-loop/start', (req, res) => {
    trafficBot.setAutoRestart(true);
    res.json({ 
        success: true, 
        message: 'Auto-loop started dengan proxy system' 
    });
});

app.post('/api/auto-loop/stop', (req, res) => {
    trafficBot.setAutoRestart(false);
    trafficBot.stopAllSessions();
    res.json({ 
        success: true, 
        message: 'Auto-loop stopped' 
    });
});

app.get('/api/all-sessions', (req, res) => {
    const sessions = trafficBot.getAllSessions();
    res.json({ success: true, sessions });
});

app.get('/api/session-logs/:sessionId', (req, res) => {
    const logs = trafficBot.getSessionLogs(req.params.sessionId);
    res.json({ success: true, logs });
});

app.post('/api/stop-session/:sessionId', (req, res) => {
    trafficBot.stopSession(req.params.sessionId);
    res.json({ success: true, message: 'Session stopped' });
});

app.post('/api/stop-all-sessions', (req, res) => {
    trafficBot.stopAllSessions();
    res.json({ success: true, message: 'All sessions stopped' });
});

app.post('/api/clear-sessions', (req, res) => {
    trafficBot.clearAllSessions();
    res.json({ success: true, message: 'All sessions cleared' });
});

app.get('/api/test-puppeteer', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });
        
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer is working correctly',
            chromePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'Default'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/proxy-status', (req, res) => {
    try {
        const status = trafficBot.getProxyStatus();
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'monitoring.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 System: SELALU MENGGUNAKAN PROXY`);
    console.log(`🎯 Test URL: https://crptoajah.blogspot.com`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
