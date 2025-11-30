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
            timeout: 180000,
            protocolTimeout: 180000
        });
        
        const version = await browser.version();
        await browser.close();

        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'Advanced Traffic Bot - NO RESOURCE BLOCKING',
            version: '4.4.0',
            puppeteer: {
                status: 'WORKING',
                version: version,
                chromium: process.env.PUPPETEER_EXECUTABLE_PATH || 'system'
            },
            features: [
                'NO RESOURCE BLOCKING',
                'All Stylesheets & Images Allowed', 
                'Enhanced Ad Detection',
                'Extended Ad Loading Time'
            ],
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
            message: 'Session started dengan NO RESOURCE BLOCKING',
            details: {
                sessionId,
                targetUrl: config.targetUrl,
                profiles: config.profileCount,
                deviceType: config.deviceType,
                proxySource: config.proxySource,
                features: [
                    'No Request Interception',
                    'All Stylesheets Allowed',
                    'All Images Allowed', 
                    'Extended Ad Loading (15s+)',
                    'Enhanced Ad Detection'
                ]
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

// 🆕 NEW ENDPOINT: Check Ad Blocking Status
app.get('/api/ad-blocking-status', async (req, res) => {
    try {
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            timeout: 60000
        });
        
        const page = await browser.newPage();
        
        // Setup NO INTERCEPTION
        await page.setRequestInterception(false);
        
        // Test dengan halaman yang mengandung ads
        await page.goto('https://www.cnn.com', { 
            waitUntil: 'networkidle2',
            timeout: 45000 
        });
        
        // Tunggu untuk ads loading
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const blockingStatus = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            const adRequests = resources.filter(r => 
                r.name.includes('googleads') || 
                r.name.includes('doubleclick') ||
                r.name.includes('googlesyndication')
            );
            
            const stylesheets = Array.from(document.styleSheets);
            const workingStylesheets = stylesheets.filter(sheet => {
                try {
                    return sheet.cssRules && sheet.cssRules.length > 0;
                } catch (e) {
                    return false;
                }
            });
            
            const images = document.images;
            const loadedImages = Array.from(images).filter(img => img.complete && img.naturalWidth > 0);
            
            return {
                adRequests: adRequests.length,
                stylesheetsTotal: stylesheets.length,
                stylesheetsWorking: workingStylesheets.length,
                imagesTotal: images.length,
                imagesLoaded: loadedImages.length,
                totalResources: resources.length,
                adBlockingDetected: adRequests.length === 0 && resources.length > 10,
                stylesheetBlocking: stylesheets.length > workingStylesheets.length,
                resourceDetails: {
                    googleAds: resources.filter(r => r.name.includes('googleads')).length,
                    doubleclick: resources.filter(r => r.name.includes('doubleclick')).length,
                    gstatic: resources.filter(r => r.name.includes('gstatic')).length,
                    stylesheets: resources.filter(r => r.name.includes('.css')).length
                }
            };
        });
        
        await browser.close();
        
        const statusMessage = blockingStatus.adBlockingDetected ? 
            '❌ AD BLOCKING DETECTED - Iklan mungkin diblokir' : 
            '✅ No ad blocking detected - Iklan seharusnya loading';
            
        const stylesheetMessage = blockingStatus.stylesheetBlocking ?
            '⚠️ Beberapa stylesheets diblokir' :
            '✅ Semua stylesheets berhasil loading';
        
        res.json({
            success: true,
            blockingStatus,
            message: statusMessage,
            stylesheetMessage: stylesheetMessage,
            recommendations: [
                'Pastikan tidak ada request interception yang aktif',
                'Izinkan semua stylesheet dan images',
                'Gunakan networkidle2 untuk waiting',
                'Tunggu minimal 10-15 detik untuk ad loading complete',
                'Periksa resource loading di browser dev tools'
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🆕 NEW ENDPOINT: Test Specific URL for Ads
app.post('/api/test-ads-detection', async (req, res) => {
    try {
        const { testUrl } = req.body;
        
        if (!testUrl) {
            return res.status(400).json({
                success: false,
                error: 'Test URL diperlukan'
            });
        }

        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            timeout: 60000
        });
        
        const page = await browser.newPage();
        
        // Setup no interception
        await page.setRequestInterception(false);
        
        // Set longer timeouts
        page.setDefaultTimeout(45000);
        page.setDefaultNavigationTimeout(60000);
        
        await page.goto(testUrl, { 
            waitUntil: 'networkidle2',
            timeout: 45000 
        });
        
        // Extended wait for ads loading
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        const adData = await page.evaluate(() => {
            const adSelectors = [
                '.adsbygoogle', 'ins.adsbygoogle', 'iframe[src*="googleads"]',
                'iframe[src*="doubleclick"]', '[id*="ad-container"]', '.ad-unit',
                '.ad-container', '.ad-banner', '.ad-wrapper', '[data-ad-status]'
            ];
            
            let ads = [];
            adSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        const isInViewport = rect.top >= 0 && rect.top < window.innerHeight;
                        const hasContent = el.innerHTML.length > 10;
                        
                        ads.push({
                            selector,
                            visible: isVisible,
                            size: { width: rect.width, height: rect.height },
                            inViewport: isInViewport,
                            area: rect.width * rect.height,
                            hasContent: hasContent,
                            tagName: el.tagName
                        });
                    });
                } catch (e) {
                    // Ignore selector errors
                }
            });
            
            // Check for iframes that might contain ads
            const iframes = document.querySelectorAll('iframe');
            let adIframes = 0;
            iframes.forEach(iframe => {
                const src = iframe.src || '';
                if (src.includes('google') || src.includes('doubleclick') || src.includes('ads')) {
                    const rect = iframe.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        adIframes++;
                    }
                }
            });
            
            return {
                totalAdsFound: ads.length,
                visibleAds: ads.filter(ad => ad.visible).length,
                viewableAds: ads.filter(ad => ad.visible && ad.inViewport).length,
                adsWithContent: ads.filter(ad => ad.hasContent).length,
                adIframes: adIframes,
                ads: ads.slice(0, 10) // Return first 10 ads for details
            };
        });
        
        await browser.close();
        
        const status = adData.totalAdsFound > 0 ? 
            `✅ ${adData.totalAdsFound} ads detected (${adData.viewableAds} viewable)` : 
            '❌ No ads detected';
            
        const suggestions = adData.totalAdsFound === 0 ? [
            'Periksa apakah website memang menampilkan ads',
            'Coba dengan website lain yang diketahui menampilkan Google Ads',
            'Pastikan tidak ada ad blocker yang aktif di browser',
            'Tunggu lebih lama untuk ad loading (15-20 detik)',
            'Periksa network tab di dev tools untuk melihat resource loading'
        ] : [
            'Ads terdeteksi dengan sukses',
            'Pastikan ads benar-benar visible dan memiliki content',
            'Monitor impression opportunities di logs'
        ];
        
        res.json({
            success: true,
            testUrl,
            adData,
            status: status,
            resourceLoading: 'NO BLOCKING - All resources allowed',
            suggestions: suggestions,
            technicalDetails: {
                waitTime: '15 seconds',
                interception: 'Disabled',
                stylesheets: 'Allowed',
                images: 'Allowed'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🆕 NEW ENDPOINT: Get Resource Loading Report
app.get('/api/resource-report/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const logs = trafficBot.getSessionLogs(sessionId);
        
        const resourceLogs = logs.filter(log => 
            log.step.includes('RESOURCE') || 
            log.step.includes('STYLESHEET') ||
            log.step.includes('AD_RESOURCE')
        );
        
        const adLogs = logs.filter(log => 
            log.step.includes('AD_') && 
            !log.step.includes('ERROR') &&
            !log.step.includes('DETECTION')
        );
        
        const summary = {
            totalResources: resourceLogs.length,
            adResources: resourceLogs.filter(log => log.step.includes('AD_RESOURCE')).length,
            stylesheets: resourceLogs.filter(log => log.step.includes('STYLESHEET')).length,
            totalAdsDetected: adLogs.filter(log => log.step.includes('VIEWABLE')).length,
            sessionDuration: logs.length > 0 ? 
                new Date(logs[logs.length-1].timestamp) - new Date(logs[0].timestamp) : 0
        };
        
        res.json({
            success: true,
            sessionId,
            summary,
            details: {
                resourceLogs: resourceLogs.slice(-10), // Last 10 resource logs
                adLogs: adLogs.slice(-10), // Last 10 ad logs
                totalLogs: logs.length
            },
            recommendations: summary.adResources === 0 ? [
                '🚨 Tidak ada ad resources yang terdeteksi',
                'Periksa proxy configuration',
                'Coba dengan website yang berbeda',
                'Test dengan /api/ad-blocking-status endpoint',
                'Pastikan target URL menampilkan ads'
            ] : [
                `✅ ${summary.adResources} ad resources terdeteksi`,
                'Monitor viewable ads count',
                'Periksa impression opportunities'
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
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
            features: 'NO RESOURCE BLOCKING - Enhanced Ad Detection',
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
            config: autoLoopConfig,
            features: 'NO RESOURCE BLOCKING - All Stylesheets & Images Allowed'
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
            totalCount: sessions.length,
            features: 'NO RESOURCE BLOCKING MODE'
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
        
        // Filter untuk resource-related logs
        const resourceLogs = logs.filter(log => 
            log.step.includes('RESOURCE') || 
            log.step.includes('STYLESHEET') ||
            log.step.includes('AD_RESOURCE')
        );
        
        res.json({ 
            success: true, 
            logs,
            sessionId: req.params.sessionId,
            logCount: logs.length,
            resourceLogsCount: resourceLogs.length,
            resourceLogs: resourceLogs.slice(-20) // Last 20 resource logs
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
                version: '4.4.0',
                puppeteer: 'Extra + Stealth - NO BLOCKING MODE',
                features: [
                    'No Resource Blocking',
                    'All Stylesheets Allowed',
                    'All Images Allowed', 
                    'Extended Ad Loading',
                    'Enhanced Ad Detection'
                ]
            },
            currentStatus: {
                activeSessions: sessions.filter(s => s.status === 'running').length,
                totalSessions: sessions.length,
                activeProxies: proxyStatus.totalActive || 0,
                qualityProxies: proxyStatus.qualityProxies || 0
            },
            configuration: {
                requestInterception: 'DISABLED',
                resourceBlocking: 'DISABLED', 
                adLoadingWait: '15+ seconds',
                networkWaiting: 'networkidle2'
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
            timeout: 180000,
            protocolTimeout: 180000
        });
        
        const version = await browser.version();
        const pages = await browser.pages();
        await browser.close();
        
        res.json({ 
            success: true, 
            message: 'Puppeteer Extra + Stealth is working dengan NO RESOURCE BLOCKING',
            version: version,
            type: 'Extra + Stealth - No Blocking Mode',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'System Chromium',
            pages: pages.length,
            configuration: {
                requestInterception: 'DISABLED',
                resourceBlocking: 'DISABLED',
                timeout: '180000ms'
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
            mode: 'NO RESOURCE BLOCKING',
            lastUpdated: '2025-01-01'
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
            // 🆕 NEW ENDPOINTS
            'GET  /api/ad-blocking-status',
            'POST /api/test-ads-detection',
            'GET  /api/resource-report/:sessionId'
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
    console.log(`\n🚀 Advanced Traffic Bot Server v4.4.0 - NO RESOURCE BLOCKING`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`⚡ Mode: NO REQUEST INTERCEPTION - All Resources Allowed`);
    console.log(`🎯 Focus: Maximize Ad Loading & Detection`);
    console.log(`🔧 Features:`);
    console.log(`   ✅ No Request Interception`);
    console.log(`   ✅ All Stylesheets Allowed`); 
    console.log(`   ✅ All Images Allowed`);
    console.log(`   ✅ Extended Ad Loading (15s+)`);
    console.log(`   ✅ Enhanced Ad Detection`);
    console.log(`🏗️ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Chromium: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'System Default'}`);
    console.log(`📊 New Endpoints: /api/ad-blocking-status, /api/test-ads-detection`);
    console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);
    
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
                timeout: 180000,
                protocolTimeout: 180000
            });
            const version = await browser.version();
            await browser.close();
            console.log(`✅ Puppeteer Ready dengan NO BLOCKING: ${version}`);
        } catch (error) {
            console.log(`❌ Puppeteer Startup Test Failed: ${error.message}`);
        }
    }, 2000);
});