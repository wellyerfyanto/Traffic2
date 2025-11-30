const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ProxyHandler = require('./proxyHandler.js');
const ProxyScraper = require('./proxyScraper.js');

puppeteer.use(StealthPlugin());

class TrafficGenerator {
  constructor() {
    this.activeSessions = new Map();
    this.sessionLogs = new Map();
    this.proxyHandler = new ProxyHandler();
    this.proxyScraper = new ProxyScraper();
    this.autoRestartEnabled = true;
    
    // ✅ ENHANCED CONFIGURATION UNTUK BETTER ADSENSE IMPRESSIONS
    this.iterationConfig = {
      minIterations: 3,
      maxIterations: 5,
      adPageMultiplier: 2.0,
      baseInteractionTime: 1.5,
      viewableMinTime: 5000,
      scrollDwellTime: 4000,
      minPageReadTime: 25000,
      maxPageReadTime: 60000,
      adLoadingWait: 10000
    };
    
    // 🎯 EXTENDED USER AGENTS 2025
    this.userAgents = {
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

    // 🎯 ENHANCED BEHAVIOR PATTERNS
    this.sessionPatterns = {
      FAST_READER: { 
        multiplier: 0.9,
        description: "Pembaca cepat",
        scrollSpeed: "fast",
        readingTime: "medium",
        viewableFocus: "high"
      },
      NORMAL_READER: { 
        multiplier: 1.2,
        description: "Pembaca normal",
        scrollSpeed: "medium", 
        readingTime: "long",
        viewableFocus: "very_high"
      },
      SLOW_READER: { 
        multiplier: 1.5,
        description: "Pembaca lambat",
        scrollSpeed: "slow",
        readingTime: "very_long",
        viewableFocus: "maximum"
      },
      DETAILED_READER: { 
        multiplier: 1.8,
        description: "Pembaca detail",
        scrollSpeed: "variable",
        readingTime: "extended",
        viewableFocus: "premium"
      }
    };

    // 🎯 ENHANCED AD DOMAINS WHITELIST
    this.adDomains = [
      'googleads', 'doubleclick', 'googlesyndication', 'google-analytics',
      'adsystem', 'amazon-adsystem', 'facebook.com/tr', 'fbcdn',
      'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'criteo',
      'taboola', 'outbrain', 'revcontent', 'adsco.re', 'monetization',
      'adsafeprotected', 'advertising', 'ads-track', 'adservice',
      'googletag', 'gstatic', 'google.com/pagead',
      'googleadservices', 'googlesyndication', 'g.doubleclick',
      'stats.g.doubleclick', 'www.google.com/ads',
      'pagead2.googlesyndication.com', 'tpc.googlesyndication.com',
      'adclick', 'analytics', 'metrics', 'tracking',
      'telemetry', 'beacon', 'pixel', 'track'
    ];

    // ✅ PROXY QUALITY MANAGEMENT
    this.proxyQuality = new Map();
  }

  // 🎯 ENHANCED BROWSER LAUNCH DENGAN PROTOCOL TIMEOUT
  async launchBrowser(config, proxyUrl) {
    console.log('🚀 Launching browser dengan Puppeteer Extra + Stealth + Enhanced Timeout...');
    
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=SitePerProcess',
      '--disable-blink-features=AutomationControlled',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      `--proxy-server=${this.formatProxyForBrowser(proxyUrl)}`,
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--aggressive-cache-discard',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0',
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages'
    ];

    const launchOptions = {
      headless: "new",
      args: args,
      ignoreHTTPSErrors: true,
      timeout: 180000, // ✅ Increased dari 120000 ke 180000
      protocolTimeout: 180000, // ✅ NEW: Tambahkan protocol timeout
      ignoreDefaultArgs: ['--disable-extensions']
    };

    // ✅ Gunakan environment Chromium jika tersedia
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log('🔧 Using system Chromium:', process.env.PUPPETEER_EXECUTABLE_PATH);
    }

    try {
      const browser = await puppeteer.launch(launchOptions);
      console.log('✅ Browser launched successfully dengan Enhanced Timeout');
      return browser;
    } catch (error) {
      console.error('❌ Browser launch failed:', error.message);
      throw error;
    }
  }

  // 🎯 ENHANCED PROXY QUALITY TESTING DENGAN TIMEOUT
  async testProxyQuality(proxyUrl, sessionId) {
    let testBrowser = null;
    try {
        this.log(sessionId, 'PROXY_QUALITY_TEST', `Testing proxy quality: ${proxyUrl}`);
        
        const testArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--proxy-server=${this.formatProxyForBrowser(proxyUrl)}`,
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas'
        ];

        testBrowser = await puppeteer.launch({
            headless: "new",
            args: testArgs,
            timeout: 45000, // ✅ Increased timeout
            protocolTimeout: 45000, // ✅ Tambah protocol timeout
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });

        const page = await testBrowser.newPage();
        
        // ✅ SET TIMEOUT SEBELUM TEST
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(40000);
        
        const startTime = Date.now();
        
        // Test dengan halaman yang lebih sederhana
        await page.goto('https://httpbin.org/ip', { 
            waitUntil: 'domcontentloaded',
            timeout: 25000 
        });
        
        const loadTime = Date.now() - startTime;
        
        // ✅ QUALITY ASSESSMENT DENGAN THRESHOLD YANG LEBIH REALISTIS
        let quality = 'UNKNOWN';
        if (loadTime < 8000) quality = 'EXCELLENT';
        else if (loadTime < 15000) quality = 'GOOD';
        else if (loadTime < 25000) quality = 'FAIR';
        else quality = 'POOR';

        this.log(sessionId, 'PROXY_QUALITY_RESULT', 
            `Proxy ${proxyUrl} - Quality: ${quality} (Load time: ${loadTime}ms)`);

        this.proxyQuality.set(proxyUrl, {
            quality: quality,
            loadTime: loadTime,
            lastTested: Date.now(),
            successCount: (this.proxyQuality.get(proxyUrl)?.successCount || 0) + 1
        });

        return quality;

    } catch (error) {
        this.log(sessionId, 'PROXY_QUALITY_FAILED', `Proxy test failed: ${error.message}`);
        
        this.proxyQuality.set(proxyUrl, {
            quality: 'FAILED',
            loadTime: 0,
            lastTested: Date.now(),
            failCount: (this.proxyQuality.get(proxyUrl)?.failCount || 0) + 1
        });

        return 'FAILED';
    } finally {
        if (testBrowser) {
            try {
                await testBrowser.close();
            } catch (closeError) {
                // Ignore close errors during testing
            }
        }
    }
  }

  // 🆕 NEW METHOD: Set User Agent dengan Retry Mechanism
  async setUserAgentWithRetry(page, deviceType, sessionId, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const userAgent = this.getRandomUserAgent(deviceType);
            
            // ✅ GUNAKAN METHOD YANG LEBIH STABIL
            await page.setUserAgent(userAgent);
            
            this.log(sessionId, 'USER_AGENT_SUCCESS', 
                `User agent berhasil di-set (attempt ${attempt}/${maxRetries})`);
            return userAgent;
            
        } catch (error) {
            this.log(sessionId, 'USER_AGENT_RETRY', 
                `Attempt ${attempt}/${maxRetries} gagal: ${error.message}`);
            
            if (attempt < maxRetries) {
                // Tunggu sebelum retry
                await this.waitForTimeout(5000);
                
                // Coba method alternatif
                try {
                    const userAgent = this.getRandomUserAgent(deviceType);
                    await page.evaluateOnNewDocument((ua) => {
                        Object.defineProperty(navigator, 'userAgent', {
                            get: () => ua
                        });
                    }, userAgent);
                    this.log(sessionId, 'USER_AGENT_ALTERNATIVE', 'User agent di-set via evaluateOnNewDocument');
                    return userAgent;
                } catch (altError) {
                    this.log(sessionId, 'USER_AGENT_ALT_FAILED', `Method alternatif juga gagal: ${altError.message}`);
                }
            } else {
                throw new Error(`Gagal set user agent setelah ${maxRetries} attempts: ${error.message}`);
            }
        }
    }
  }

  // 🎯 ENHANCED SESSION EXECUTION DENGAN PROTOCOL TIMEOUT HANDLING
  async executeSession(sessionId, config) {
    let browser;
    let currentProxy = null;
    let page = null;
    
    try {
      // ✅ GET QUALITY PROXY
      currentProxy = this.getQualityProxy(sessionId);
      if (!currentProxy) {
        throw new Error('Tidak ada proxy berkualitas yang tersedia');
      }

      this.log(sessionId, 'PROXY_SELECTED', `Menggunakan proxy: ${currentProxy.url} - Quality: ${currentProxy.quality}`);

      this.log(sessionId, 'STEP_1', 'Meluncurkan browser dengan enhanced protocol timeout...');
      browser = await this.launchBrowser(config, currentProxy.url);
      
      // ✅ ENHANCED PAGE CREATION DENGAN PROTOCOL TIMEOUT
      this.log(sessionId, 'PAGE_SETUP', 'Membuat page dengan enhanced timeout settings...');
      page = await browser.newPage();
      
      // ✅ INCREASE TIMEOUTS UNTUK PROXY QUALITY
      page.setDefaultTimeout(120000); // ✅ Increased dari 90000
      page.setDefaultNavigationTimeout(150000); // ✅ Increased dari 120000

      // ✅ SET USER AGENT DENGAN RETRY MECHANISM
      const userAgent = await this.setUserAgentWithRetry(page, config.deviceType, sessionId);
      
      // ✅ SET EXTRA HEADERS UNTUK BETTER DETECTION
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.google.com/'
      });
      
      const browserInfo = this.extractBrowserInfo(userAgent);
      this.log(sessionId, 'USER_AGENT_SET', `Menggunakan ${browserInfo}`);
      
      await page.setViewport({ 
        width: config.deviceType === 'mobile' ? 375 : 1280, 
        height: config.deviceType === 'mobile' ? 667 : 720 
      });

      // Setup interception
      await this.setupAdFriendlyInterception(page, sessionId);

      this.log(sessionId, 'STEP_1_COMPLETE', 'Browser berhasil diluncurkan dengan enhanced timeout');

      this.log(sessionId, 'STEP_2', `Navigasi ke: ${config.targetUrl}`);
      
      try {
        await this.navigateWithRetry(page, config.targetUrl, sessionId);
        
        this.log(sessionId, 'STEP_2_COMPLETE', 'Berhasil navigasi ke target URL');

        // ✅ EXTENDED WAIT FOR AD NETWORKS
        this.log(sessionId, 'AD_NETWORK_WAIT', '⏳ Menunggu ad networks loading extended...');
        await this.waitForTimeout(12000);

        await this.executeAllSteps(page, sessionId, config);

        // ✅ MARK PROXY AS SUCCESSFUL
        this.markProxySuccess(currentProxy.url, sessionId);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua langkah berhasil diselesaikan dengan enhanced timeout system');

      } catch (navError) {
        this.log(sessionId, 'NAVIGATION_ERROR', `Navigasi gagal: ${navError.message}`);
        throw navError;
      }

    } catch (error) {
      this.log(sessionId, 'EXECUTION_ERROR', `Error selama eksekusi: ${error.message}`);
      if (currentProxy) {
        this.markProxyFailed(currentProxy.url, sessionId);
        this.proxyHandler.removeFailedProxy(currentProxy.url);
        this.log(sessionId, 'PROXY_REMOVED', `Proxy gagal dihapus dari pool: ${currentProxy.url}`);
      }
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.log(sessionId, 'BROWSER_CLOSED', 'Browser ditutup');
        } catch (closeError) {
          this.log(sessionId, 'BROWSER_CLOSE_ERROR', `Error menutup browser: ${closeError.message}`);
        }
      }
    }
  }

  // 🎯 NEW: GET QUALITY PROXY
  getQualityProxy(sessionId) {
    const proxies = this.proxyHandler.getAllProxies();
    if (proxies.length === 0) return null;

    // Filter proxies by quality
    const qualityProxies = proxies.filter(proxy => {
      const qualityData = this.proxyQuality.get(proxy);
      return qualityData && ['EXCELLENT', 'GOOD', 'FAIR'].includes(qualityData.quality);
    });

    if (qualityProxies.length > 0) {
      const selectedProxy = qualityProxies[Math.floor(Math.random() * qualityProxies.length)];
      const qualityData = this.proxyQuality.get(selectedProxy);
      return {
        url: selectedProxy,
        quality: qualityData.quality,
        loadTime: qualityData.loadTime
      };
    }

    // Fallback to any proxy if no quality proxies found
    const fallbackProxy = proxies[Math.floor(Math.random() * proxies.length)];
    return {
      url: fallbackProxy,
      quality: 'UNKNOWN',
      loadTime: 0
    };
  }

  // 🎯 NEW: MARK PROXY SUCCESS
  markProxySuccess(proxyUrl, sessionId) {
    const qualityData = this.proxyQuality.get(proxyUrl) || {};
    qualityData.successCount = (qualityData.successCount || 0) + 1;
    qualityData.lastSuccess = Date.now();
    this.proxyQuality.set(proxyUrl, qualityData);
    
    this.log(sessionId, 'PROXY_SUCCESS', `Proxy ${proxyUrl} marked as successful`);
  }

  // 🎯 NEW: MARK PROXY FAILED
  markProxyFailed(proxyUrl, sessionId) {
    const qualityData = this.proxyQuality.get(proxyUrl) || {};
    qualityData.failCount = (qualityData.failCount || 0) + 1;
    qualityData.lastFail = Date.now();
    this.proxyQuality.set(proxyUrl, qualityData);
    
    this.log(sessionId, 'PROXY_FAILED', `Proxy ${proxyUrl} marked as failed`);
  }

  // 🎯 ENHANCED MAIN EXECUTION DENGAN EXTENDED TIMES
  async executeAllSteps(page, sessionId, config) {
    this.page = page;
    
    const pattern = this.getSessionPattern(sessionId);
    this.log(sessionId, 'SESSION_PATTERN', 
      `Pattern: ${pattern.description} (${pattern.patternType}) - Multiplier: ${pattern.multiplier}x`);

    const iterationCount = Math.floor(Math.random() * 
      (this.iterationConfig.maxIterations - this.iterationConfig.minIterations + 1)) + 
      this.iterationConfig.minIterations;
    
    this.log(sessionId, 'ITERATION_SETUP', `Akan melakukan ${iterationCount} iterasi dengan extended timing`);

    let currentUrl = config.targetUrl;
    let totalViewableInteractions = 0;
    let totalViewableAdsDetected = 0;
    let totalImpressionOpportunities = 0;
    
    for (let iteration = 1; iteration <= iterationCount; iteration++) {
      this.log(sessionId, `ITERATION_${iteration}_START`, `🎯 Memulai iterasi ${iteration}/${iterationCount}`);
      
      if (iteration > 1) {
        this.log(sessionId, 'NAVIGATION', `Mengunjungi: ${currentUrl}`);
        try {
          await this.navigateWithRetry(page, currentUrl, sessionId);
        } catch (navError) {
          this.log(sessionId, 'NAVIGATION_ERROR', `Navigasi gagal: ${navError.message}`);
          continue;
        }
      }

      try {
        // ✅ DETEKSI IKLAN AWAL UNTUK STRATEGY PLANNING
        const initialAdData = await this.detectAdPage(page, sessionId);
        const timeMultiplier = initialAdData.hasAds ? this.iterationConfig.adPageMultiplier : 1.0;
        
        if (initialAdData.isViewable) {
          totalViewableAdsDetected += initialAdData.viewableCount;
          totalImpressionOpportunities += initialAdData.potentialImpressions;
          this.log(sessionId, 'VIEWABLE_MODE_ACTIVE', 
            `🎯 ${initialAdData.viewableCount} VIEWABLE ADS terdeteksi - ${initialAdData.potentialImpressions} impression opportunities`);
        }

        const contentComplexity = await this.analyzeContentComplexity(page);
        
        // 🎯 ENHANCED STEP SEQUENCE DENGAN EXTENDED TIMING
        const steps = [
          {
            name: 'EXTENDED_READING_SESSION',
            action: async () => {
              this.log(sessionId, 'EXTENDED_READING', 'Membaca konten dengan extended timing untuk ad loading...');
              await this.extendedReadingSession(page, sessionId, contentComplexity, initialAdData, timeMultiplier);
            },
            timeout: 120000
          },
          {
            name: 'VIEWABLE_AD_INTERACTION',
            action: async () => {
              this.log(sessionId, 'VIEWABLE_INTERACTION', 'Interaksi optimized untuk viewable ads dengan extended timing...');
              const result = await this.comprehensiveAdInteraction(page, sessionId, timeMultiplier);
              if (result) totalViewableInteractions++;
            },
            timeout: 240000
          },
          {
            name: 'DEEP_VIEWABLE_SCROLL',
            action: async () => {
              this.log(sessionId, 'DEEP_VIEWABLE_SCROLL', 'Scroll mendalam untuk maksimalkan viewable exposure dengan extended timing...');
              await this.humanScroll(page, sessionId, timeMultiplier);
              
              // ✅ POST-SCROLL AD DETECTION
              const postScrollAdData = await this.detectAdPage(page, sessionId);
              if (postScrollAdData.isViewable && !initialAdData.isViewable) {
                this.log(sessionId, 'SCROLL_CREATED_VIEWABLE', 
                  `✅ Scroll berhasil membuat ${postScrollAdData.viewableCount} iklan menjadi VIEWABLE`);
              }
            },
            timeout: 180000
          },
          {
            name: 'FINAL_VIEWABLE_ENGAGEMENT',
            action: async () => {
              this.log(sessionId, 'FINAL_VIEWABLE_ENGAGEMENT', 'Final engagement dengan viewable ads extended...');
              await this.finalAdEngagement(page, sessionId);
            },
            timeout: 45000
          }
        ];

        for (const [index, step] of steps.entries()) {
          try {
            const stepStartTime = Date.now();
            
            await Promise.race([
              step.action(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Step ${step.name} timeout`)), step.timeout)
              )
            ]);
            
            const stepDuration = Date.now() - stepStartTime;
            this.log(sessionId, `${step.name}_COMPLETE`, 
              `Step selesai (${Math.round(stepDuration/1000)} detik)`);
            
            // Random delay antara steps
            if (index < steps.length - 1) {
              const stepDelay = 6000 * timeMultiplier;
              await this.waitForTimeout(stepDelay);
            }
            
          } catch (stepError) {
            this.log(sessionId, `${step.name}_ERROR`, `Step gagal: ${stepError.message}`);
          }
        }

        this.log(sessionId, `ITERATION_${iteration}_COMPLETE`, 
          `✅ Iterasi ${iteration} selesai dengan ${totalViewableInteractions} interaksi viewable`);

      } catch (error) {
        this.log(sessionId, `ITERATION_${iteration}_ERROR`, `Iterasi gagal: ${error.message}`);
      }
    }

    this.log(sessionId, 'ALL_ITERATIONS_COMPLETED', 
      `🎉 Semua ${iterationCount} iterasi selesai! Total: ${totalViewableInteractions} interaksi VIEWABLE, ${totalViewableAdsDetected} viewable ads, ${totalImpressionOpportunities} impression opportunities`);

    // Reset page reference
    this.page = null;
  }

  // 🎯 FIXED WAIT FUNCTION
  async waitForTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🎯 MICRO SCROLL UNTUK NATURAL BEHAVIOR
  async microScroll(page, sessionId) {
    try {
      const scrollAmount = 50 + (Math.random() * 150);
      await page.evaluate((amount) => {
        window.scrollBy({
          top: amount,
          behavior: 'smooth'
        });
      }, scrollAmount);
      
      await this.waitForTimeout(1000 + (Math.random() * 1500));
    } catch (error) {
      // Ignore micro-scroll errors
    }
  }

  // 🎯 CONTENT ANALYSIS
  async analyzeContentComplexity(page) {
    try {
      const complexity = await page.evaluate(() => {
        const textContent = document.body.innerText || '';
        const wordCount = textContent.split(/\s+/).length;
        const imageCount = document.images.length;
        const paragraphCount = document.querySelectorAll('p').length;
        
        let score = 0;
        if (wordCount > 1000) score += 3;
        else if (wordCount > 500) score += 2;
        else if (wordCount > 200) score += 1;
        
        if (imageCount > 10) score += 2;
        else if (imageCount > 5) score += 1;
        
        if (paragraphCount > 15) score += 1;
        
        if (score >= 5) return 'complex';
        if (score >= 3) return 'medium';
        return 'simple';
      });
      return complexity;
    } catch (error) {
      return 'medium';
    }
  }

  // 🎯 HUMAN SCROLL
  async humanScroll(page, sessionId, multiplier = 1.0) {
    const scrollSteps = [300, 600, 900, 1200, 1500, 1800, 2100];
    let currentPosition = 0;
    
    for (const targetPosition of scrollSteps) {
      const scrollDistance = targetPosition - currentPosition;
      if (scrollDistance <= 0) continue;
      
      // Scroll dengan kecepatan manusia
      const scrollDuration = Math.max(2000, scrollDistance * 2) * multiplier;
      const steps = Math.ceil(scrollDuration / 100);
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const currentScroll = currentPosition + (scrollDistance * progress);
        
        await page.evaluate((pos) => {
          window.scrollTo(0, pos);
        }, currentScroll);
        
        await this.waitForTimeout(100);
      }
      
      currentPosition = targetPosition;
      
      // Tunggu sebentar di setiap posisi
      const dwellTime = 2000 + (Math.random() * 3000);
      await this.waitForTimeout(dwellTime);
      
      this.log(sessionId, 'SCROLL_PROGRESS', `Scrolled to ${currentPosition}px`);
    }
    
    // Scroll kembali ke atas secara perlahan
    for (let i = currentPosition; i >= 0; i -= 50) {
      await page.evaluate((pos) => {
        window.scrollTo(0, pos);
      }, i);
      await this.waitForTimeout(50);
    }
  }

  // 🎯 FINAL AD ENGAGEMENT
  async finalAdEngagement(page, sessionId) {
    try {
      this.log(sessionId, 'FINAL_ENGAGEMENT', 'Melakukan final engagement dengan ads...');
      
      // Scroll cepat melalui halaman untuk trigger impressions
      const quickScrollPositions = [100, 400, 800, 1200, 1600, 2000];
      
      for (const position of quickScrollPositions) {
        await page.evaluate((pos) => {
          window.scrollTo(0, pos);
        }, position);
        
        await this.waitForTimeout(1000 + (Math.random() * 2000));
        
        // Trigger mouse movement over ads
        await page.evaluate(() => {
          const ads = document.querySelectorAll('.adsbygoogle, [id*="ad"]');
          ads.forEach(ad => {
            const rect = ad.getBoundingClientRect();
            if (rect.top >= 0 && rect.top < window.innerHeight) {
              const event = new MouseEvent('mousemove', {
                bubbles: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
              });
              ad.dispatchEvent(event);
            }
          });
        });
      }
      
      this.log(sessionId, 'FINAL_ENGAGEMENT_COMPLETE', 'Final engagement completed');
    } catch (error) {
      this.log(sessionId, 'FINAL_ENGAGEMENT_ERROR', `Error final engagement: ${error.message}`);
    }
  }

  // 🎯 ENHANCED NAVIGATION DENGAN AD LOADING WAIT
  async navigateWithRetry(page, url, sessionId, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(sessionId, 'NAVIGATION_ATTEMPT', `Navigasi attempt ${attempt}/${maxRetries} ke: ${url}`);
        
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 45000
        });
        
        const adWaitTime = this.iterationConfig.adLoadingWait + (Math.random() * 5000);
        this.log(sessionId, 'AD_LOADING_WAIT', `⏳ Menunggu ${Math.round(adWaitTime/1000)}s untuk ad networks loading...`);
        await this.waitForTimeout(adWaitTime);
        
        await page.evaluate(() => {
          window.scrollBy(0, 200);
        });
        await this.waitForTimeout(3000);

        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await this.waitForTimeout(2000);
        
        this.log(sessionId, 'NAVIGATION_SUCCESS', '✅ Berhasil navigasi ke halaman dengan ad loading optimization');
        return true;
        
      } catch (error) {
        this.log(sessionId, 'NAVIGATION_RETRY', 
          `Attempt ${attempt}/${maxRetries} gagal: ${error.message}`);
        
        if (attempt < maxRetries) {
          const retryDelay = 8000 + (Math.random() * 4000);
          this.log(sessionId, 'NAVIGATION_RETRY_DELAY', `⏳ Tunggu ${Math.round(retryDelay/1000)}s sebelum retry...`);
          await this.waitForTimeout(retryDelay);
        } else {
          throw error;
        }
      }
    }
  }

  // 🎯 ENHANCED AD DETECTION
  async detectAdPage(page, sessionId) {
    try {
      const adData = await page.evaluate(() => {
        const adSelectors = [
          '.adsbygoogle', 'ins.adsbygoogle', 
          'iframe[src*="googleads"]', 'iframe[src*="doubleclick"]',
          'div[id*="google_ads"]', '[data-google-query-id]',
          'a[href*="googleadservices.com"]',
          '[id*="ad-container"]', '.ad-unit', '.ad-container',
          '[data-ad-status]', '.ad-slot', '[data-ad-client]',
          '[class*="ad-" i]', '[id*="ad-" i]', 
          '.ad-banner', '.ad-wrapper', '.ad-placeholder',
          '.google-ad', '.ads-wrapper', '.advertising',
          '[data-ad-load]', '[data-ad-slot]', '.lazy-ad',
          '.ad-placement', '.ad-surface', '[data-ad-type]',
          '.ad-holder', '.ad-frame', '.ad-content',
          'iframe[id*="google_ads_iframe"]',
          '[data-ad-format]', '[data-ad-layout]',
          '[data-ad-width]', '[data-ad-height]',
          '.AdSense', '.advertisment', '.sponsored-content',
          '.text-ad', '.native-ad', '.display-ad',
          'div[data-ad-unit-path]', '[data-ad-slot]',
          '.ads-area', '.ad-block', '.ad-space',
          '.advert', '.promo-box', '.sponsored'
        ];
        
        let detectedAds = [];
        let totalAds = 0;
        let visibleAds = 0;
        let viewableAds = 0;
        let largeViewableAds = 0;
        let potentialImpressions = 0;
        let googleAdsCount = 0;
        
        for (const selector of adSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            totalAds += elements.length;
            
            for (const element of elements) {
              const rect = element.getBoundingClientRect();
              const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
              const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
              
              const isInViewport = rect.top >= 0 && 
                                  rect.left >= 0 && 
                                  rect.bottom <= (viewportHeight + 100) &&
                                  rect.right <= (viewportWidth + 100);
              
              const isVisible = rect.width > 0 && rect.height > 0;
              const isLargeAd = (rect.width * rect.height) > 25000;
              const isViewableArea = (rect.width * rect.height) > 10000;
              const isGoogleAd = selector.includes('google') || element.outerHTML.includes('google');
              
              if (isVisible) {
                visibleAds++;
                if (isGoogleAd) googleAdsCount++;
                
                if (isInViewport && isViewableArea) {
                  viewableAds++;
                  if (isLargeAd) largeViewableAds++;
                  
                  if (isInViewport && rect.width >= 300 && rect.height >= 250) {
                    potentialImpressions++;
                  }
                  
                  detectedAds.push({
                    selector: selector,
                    position: { top: rect.top, left: rect.left },
                    size: { width: rect.width, height: rect.height },
                    viewable: true,
                    area: rect.width * rect.height,
                    isLarge: isLargeAd,
                    isGoogleAd: isGoogleAd,
                    elementTop: element.offsetTop,
                    potentialImpression: (rect.width >= 300 && rect.height >= 250),
                    inViewport: true
                  });
                  
                  if (element.getAttribute('data-ad-load') === 'lazy' || 
                      element.classList.contains('lazy-ad')) {
                    try {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      const event = new MouseEvent('mouseenter', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                      });
                      element.dispatchEvent(event);
                    } catch (e) {
                      // Ignore errors
                    }
                  }
                } else {
                  detectedAds.push({
                    selector: selector,
                    position: { top: rect.top, left: rect.left },
                    size: { width: rect.width, height: rect.height },
                    viewable: false,
                    area: rect.width * rect.height,
                    isLarge: isLargeAd,
                    isGoogleAd: isGoogleAd,
                    elementTop: element.offsetTop,
                    potentialImpression: false,
                    inViewport: isInViewport
                  });
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        return { 
          totalAds, 
          visibleAds, 
          viewableAds,
          largeViewableAds,
          potentialImpressions,
          googleAdsCount,
          detectedAds,
          viewport: {
            width: viewportWidth,
            height: viewportHeight
          },
          timestamp: Date.now()
        };
      });
      
      if (adData.viewableAds > 0) {
        this.log(sessionId, 'AD_VIEWABLE_DETECTED', 
          `🎯 ${adData.viewableAds} VIEWABLE ADS (${adData.googleAdsCount} Google Ads, ${adData.potentialImpressions} potential impressions)`);
        return {
          hasAds: true,
          viewableCount: adData.viewableAds,
          largeViewableCount: adData.largeViewableAds,
          potentialImpressions: adData.potentialImpressions,
          googleAdsCount: adData.googleAdsCount,
          totalCount: adData.totalAds,
          isViewable: true,
          detectedAds: adData.detectedAds,
          viewport: adData.viewport
        };
      } else if (adData.visibleAds > 0) {
        this.log(sessionId, 'AD_VISIBLE_ONLY', 
          `👀 ${adData.visibleAds} iklan visible (${adData.googleAdsCount} Google Ads) TAPI TIDAK VIEWABLE`);
        return {
          hasAds: true,
          viewableCount: 0,
          largeViewableCount: 0,
          potentialImpressions: 0,
          googleAdsCount: adData.googleAdsCount,
          totalCount: adData.totalAds,
          isViewable: false,
          detectedAds: adData.detectedAds,
          viewport: adData.viewport
        };
      }
      
      this.log(sessionId, 'NO_ADS_DETECTED', '❌ Tidak ada iklan yang terdeteksi');
      return {
        hasAds: false,
        viewableCount: 0,
        largeViewableCount: 0,
        potentialImpressions: 0,
        googleAdsCount: 0,
        totalCount: 0,
        isViewable: false,
        detectedAds: [],
        viewport: adData.viewport
      };
      
    } catch (error) {
      this.log(sessionId, 'AD_DETECTION_ERROR', `Error deteksi iklan: ${error.message}`);
      return {
        hasAds: false,
        viewableCount: 0,
        largeViewableCount: 0,
        potentialImpressions: 0,
        googleAdsCount: 0,
        totalCount: 0,
        isViewable: false,
        detectedAds: [],
        error: error.message
      };
    }
  }

  // 🎯 ENHANCED READING SESSION
  async extendedReadingSession(page, sessionId, contentComplexity, adData, multiplier = 1.0) {
    const pattern = this.getSessionPattern(sessionId);
    
    let baseReadingTime;
    switch(contentComplexity) {
      case 'simple': 
        baseReadingTime = this.iterationConfig.minPageReadTime;
        break;
      case 'complex': 
        baseReadingTime = this.iterationConfig.maxPageReadTime;
        break;
      case 'medium': default: 
        baseReadingTime = (this.iterationConfig.minPageReadTime + this.iterationConfig.maxPageReadTime) / 2;
        break;
    }
    
    if (adData.hasAds) {
      baseReadingTime *= 1.5;
      if (adData.isViewable) {
        baseReadingTime *= 1.3;
      }
    }

    const minMs = baseReadingTime * pattern.multiplier * 0.8;
    const maxMs = baseReadingTime * pattern.multiplier * 1.2;
    const totalReadingTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    
    this.log(sessionId, 'EXTENDED_READING_SESSION', 
      `📖 Extended reading session: ${Math.round(totalReadingTime/1000)}s [${contentComplexity.toUpperCase()}, ${adData.hasAds ? 'HAS_ADS' : 'NO_ADS'}]`);

    const startTime = Date.now();
    let timeSpent = 0;
    
    while (timeSpent < totalReadingTime) {
      const remainingTime = totalReadingTime - timeSpent;
      
      const chunkTime = Math.min(remainingTime, 5000 + (Math.random() * 10000));
      this.log(sessionId, 'READING_CHUNK', `⏳ Reading chunk: ${Math.round(chunkTime/1000)}s`);
      
      await this.waitForTimeout(chunkTime);
      
      const activity = Math.random();
      if (activity > 0.7) {
        await this.microScroll(page, sessionId);
      } else if (activity > 0.5) {
        await this.randomMouseMovement(page, sessionId);
      } else if (activity > 0.4 && adData.hasAds) {
        await this.quickAdCheck(page, sessionId);
      }
      
      timeSpent = Date.now() - startTime;
      
      if (Math.floor(timeSpent / 20000) > Math.floor((timeSpent - chunkTime) / 20000)) {
        const progress = Math.min(100, Math.round((timeSpent / totalReadingTime) * 100));
        this.log(sessionId, 'READING_PROGRESS', `📊 Reading progress: ${progress}%`);
      }
    }
    
    this.log(sessionId, 'READING_SESSION_COMPLETE', 
      `✅ Reading session completed: ${Math.round(timeSpent/1000)}s total`);
    
    return true;
  }

  // 🎯 RANDOM MOUSE MOVEMENT
  async randomMouseMovement(page, sessionId) {
    try {
      await page.evaluate(() => {
        const moves = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < moves; i++) {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          
          const event = new MouseEvent('mousemove', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
          });
          
          document.dispatchEvent(event);
        }
      });
    } catch (error) {
      // Ignore mouse movement errors
    }
  }

  // 🎯 QUICK AD CHECK
  async quickAdCheck(page, sessionId) {
    try {
      const adData = await this.detectAdPage(page, sessionId);
      if (adData.isViewable) {
        this.log(sessionId, 'QUICK_AD_CHECK', `👀 Quick check: ${adData.viewableCount} viewable ads detected`);
        
        await page.evaluate(() => {
          const adElements = document.querySelectorAll('.adsbygoogle, ins.adsbygoogle');
          adElements.forEach(element => {
            try {
              const rect = element.getBoundingClientRect();
              if (rect.top >= 0 && rect.top < window.innerHeight) {
                const event = new MouseEvent('mouseover', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                });
                element.dispatchEvent(event);
              }
            } catch (e) {
              // Ignore errors
            }
          });
        });
      }
    } catch (error) {
      // Ignore quick check errors
    }
  }

  // 🎯 ENHANCED REQUEST INTERCEPTION
  async setupAdFriendlyInterception(page, sessionId) {
    return new Promise((resolve) => {
      page.setRequestInterception(true);
      
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();
        
        if (this.isAdDomain(url)) {
          req.continue();
          return;
        }
        
        if (['document', 'script', 'xhr', 'fetch', 'websocket'].includes(resourceType)) {
          req.continue();
          return;
        }
        
        if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
          req.continue();
          return;
        }
        
        req.continue();
      });

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('googleads') || url.includes('doubleclick')) {
          this.log(sessionId, 'AD_REQUEST', `📡 Ad request: ${response.status()} - ${url.substring(0, 80)}...`);
        }
      });

      setTimeout(resolve, 2000);
    });
  }

  // 🎯 ENHANCED SCROLL UNTUK MEMBUAT IKLAN VIEWABLE
  async scrollToMakeAdsViewable(page, sessionId, adData) {
    try {
      if (!adData.hasAds || adData.isViewable) {
        return true;
      }

      this.log(sessionId, 'SCROLL_FOR_VIEWABLE', 
        `🔄 Scroll optimization untuk membuat ${adData.totalCount} iklan menjadi VIEWABLE...`);
      
      const nonViewableAds = adData.detectedAds.filter(ad => !ad.viewable && ad.area > 1000);
      
      if (nonViewableAds.length === 0) {
        this.log(sessionId, 'NO_ADS_TO_SCROLL', 'Tidak ada iklan yang perlu di-scroll');
        return true;
      }

      let madeViewable = 0;

      for (const ad of nonViewableAds.slice(0, 5)) {
        const scrollTarget = ad.elementTop - (adData.viewport.height / 2) + (ad.size.height / 2);
        
        this.log(sessionId, 'SCROLL_TO_AD', 
          `📏 Scroll ke iklan di posisi ${Math.round(scrollTarget)}px (current: ${ad.position.top}px)`);
        
        await page.evaluate((target) => {
          window.scrollTo({
            top: target,
            behavior: 'smooth'
          });
        }, scrollTarget);
        
        const waitTime = 5000 + (Math.random() * 3000);
        this.log(sessionId, 'VIEWABLE_LOAD_WAIT', `⏳ Tunggu ${Math.round(waitTime/1000)}s untuk viewable load...`);
        await this.waitForTimeout(waitTime);
        
        const currentAdData = await this.detectAdPage(page, sessionId);
        if (currentAdData.isViewable) {
          madeViewable++;
          this.log(sessionId, 'AD_NOW_VIEWABLE', 
            `✅ Iklan berhasil menjadi VIEWABLE setelah scroll (${madeViewable}/${nonViewableAds.length})`);
          
          const dwellTime = 3000 + (Math.random() * 2000);
          this.log(sessionId, 'VIEWABLE_DWELL_TIME', `⏸️ Dwell time ${Math.round(dwellTime/1000)}s pada viewable ad`);
          await this.waitForTimeout(dwellTime);
        } else {
          this.log(sessionId, 'AD_STILL_NOT_VIEWABLE', '⚠️ Iklan masih tidak viewable setelah scroll');
        }
        
        if (Math.random() > 0.5) {
          await this.waitForTimeout(2000 + (Math.random() * 3000));
        }
      }
      
      this.log(sessionId, 'SCROLL_OPTIMIZATION_COMPLETE', 
        `🎯 Scroll optimization selesai: ${madeViewable} iklan berhasil dibuat VIEWABLE`);
      return madeViewable > 0;
      
    } catch (error) {
      this.log(sessionId, 'SCROLL_VIEWABLE_ERROR', `Error scroll untuk viewable: ${error.message}`);
      return false;
    }
  }

  // 🎯 ENHANCED AD INTERACTION
  async comprehensiveAdInteraction(page, sessionId, multiplier = 1.0) {
    try {
      this.log(sessionId, 'COMPREHENSIVE_AD_INTERACTION', 'Memulai interaksi iklan dengan FOKUS IMPRESSION...');
      
      const initialAdData = await this.detectAdPage(page, sessionId);
      
      if (!initialAdData.hasAds) {
        this.log(sessionId, 'NO_ADS_FOUND', '❌ Tidak ada iklan yang ditemukan - skip interaksi');
        return false;
      }
      
      if (!initialAdData.isViewable) {
        const scrollResult = await this.scrollToMakeAdsViewable(page, sessionId, initialAdData);
        if (scrollResult) {
          await this.waitForTimeout(5000);
        }
      }
      
      const currentAdData = await this.detectAdPage(page, sessionId);
      let interactionCount = 0;
      let viewableInteractions = 0;
      let impressionOpportunities = 0;
      
      const scrollPositions = [100, 300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100, 2300];
      
      for (let i = 0; i < scrollPositions.length; i++) {
        const position = scrollPositions[i];
        
        await page.evaluate((pos) => {
          window.scrollTo({
            top: pos,
            behavior: 'smooth'
          });
        }, position);
        
        const scrollWaitTime = 4000 + (Math.random() * 3000);
        this.log(sessionId, 'IMPRESSION_DWELL', 
          `⏸️  Impression dwell time ${Math.round(scrollWaitTime/1000)}s di posisi ${position}px`);
        await this.waitForTimeout(scrollWaitTime);
        
        const scrollAdData = await this.detectAdPage(page, sessionId);
        
        if (scrollAdData.isViewable && scrollAdData.potentialImpressions > 0) {
          viewableInteractions++;
          impressionOpportunities += scrollAdData.potentialImpressions;
          
          const hoverResult = await page.evaluate(() => {
            const viewportHeight = window.innerHeight;
            const adElements = document.querySelectorAll([
              '.adsbygoogle', 'ins.adsbygoogle', 
              'iframe[src*="googleads"]', '[id*="ad-container"]',
              '.ad-unit', '.ad-container', 'div[id*="google_ads"]',
              '[data-google-query-id]', '.ad-slot'
            ].join(','));
            
            let interactionCount = 0;
            
            for (const element of adElements) {
              try {
                const rect = element.getBoundingClientRect();
                const isInViewport = rect.top >= 0 && rect.top < viewportHeight && 
                                   rect.width > 0 && rect.height > 0;
                
                if (isInViewport) {
                  const events = [
                                    'mouseenter', 'mouseover', 'mousemove',
                                    'focus', 'scroll', 'load'
                                ];
                  
                  events.forEach(eventType => {
                    try {
                      const event = new Event(eventType, {
                        bubbles: true,
                        cancelable: true
                      });
                      element.dispatchEvent(event);
                    } catch (e) {
                      // Ignore event errors
                    }
                  });
                  
                  if (rect.width >= 300 && rect.height >= 250) {
                    const visibilityEvent = new CustomEvent('visibilitychange', {
                      detail: { isVisible: true }
                    });
                    element.dispatchEvent(visibilityEvent);
                  }
                  
                  interactionCount++;
                }
              } catch (e) {
                continue;
              }
            }
            return interactionCount;
          });
          
          if (hoverResult > 0) {
            interactionCount += hoverResult;
            this.log(sessionId, 'IMPRESSION_INTERACTION', 
              `🖱️  ${hoverResult} interaksi impression di posisi ${position}px`);
          }
        }
        
        if (Math.random() > 0.5) {
          const extendedPause = 3000 + (Math.random() * 4000);
          this.log(sessionId, 'IMPRESSION_PAUSE', 
            `⏸️  Extended impression pause ${Math.round(extendedPause/1000)}s`);
          await this.waitForTimeout(extendedPause);
        }
        
        if (Math.random() > 0.6 && i < scrollPositions.length - 1) {
          await this.microScroll(page, sessionId);
        }
      }
      
      this.log(sessionId, 'COMPREHENSIVE_AD_SUCCESS', 
        `✅ Interaksi selesai: ${interactionCount} interaksi, ${impressionOpportunities} impression opportunities`);
      return impressionOpportunities > 0;
      
    } catch (error) {
      this.log(sessionId, 'COMPREHENSIVE_AD_ERROR', `Error interaksi iklan: ${error.message}`);
      return false;
    }
  }

  // 🎯 UTILITY METHODS
  getRandomUserAgent(deviceType) {
    const agents = this.userAgents[deviceType] || this.userAgents.desktop;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  extractBrowserInfo(userAgent) {
    if (userAgent.includes('Chrome/')) {
      return userAgent.includes('Mobile') ? 'Chrome Mobile' : 'Chrome Desktop';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      return userAgent.includes('Mobile') ? 'Safari Mobile' : 'Safari Desktop';
    } else if (userAgent.includes('Firefox/')) {
      return userAgent.includes('Mobile') ? 'Firefox Mobile' : 'Firefox Desktop';
    } else if (userAgent.includes('Edg/')) {
      return 'Microsoft Edge';
    }
    return 'Unknown Browser';
  }

  getSessionPattern(sessionId) {
    const numbers = sessionId.match(/\d+/g);
    const numericValue = numbers ? parseInt(numbers.join('')) % 100 : Date.now() % 100;
    
    const isEven = numericValue % 2 === 0;
    const patterns = Object.keys(this.sessionPatterns);
    
    let patternKey;
    if (isEven) {
      patternKey = Math.random() > 0.5 ? 'SLOW_READER' : 'DETAILED_READER';
    } else {
      patternKey = Math.random() > 0.5 ? 'FAST_READER' : 'NORMAL_READER';
    }
    
    const pattern = this.sessionPatterns[patternKey];
    const randomVariation = 0.8 + (Math.random() * 0.4);
    const finalMultiplier = pattern.multiplier * randomVariation;
    
    return {
      ...pattern,
      finalMultiplier,
      isEven,
      patternType: patternKey
    };
  }

  isAdDomain(url) {
    return this.adDomains.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
  }

  formatProxyForBrowser(proxyUrl) {
    if (proxyUrl.includes('://')) {
      const urlParts = proxyUrl.split('://');
      return urlParts[1];
    }
    return proxyUrl;
  }

  log(sessionId, step, message) {
    const timestamp = new Date().toLocaleString('id-ID');
    const logEntry = { timestamp, step, message };
    
    if (this.sessionLogs.has(sessionId)) {
      this.sessionLogs.get(sessionId).push(logEntry);
    }
    
    const logMessage = `[${sessionId}] ${step}: ${message}`;
    if (step.includes('ERROR') || step.includes('FAILED')) {
      console.error('❌', logMessage);
    } else if (step.includes('WARNING')) {
      console.warn('⚠️', logMessage);
    } else if (step.includes('AD_VIEWABLE') || step.includes('VIEWABLE')) {
      console.log('🎯', logMessage);
    } else if (step.includes('AD_') || step.includes('ADS')) {
      console.log('💰', logMessage);
    } else if (step.includes('USER_AGENT')) {
      console.log('🌐', logMessage);
    } else if (step.includes('PROXY')) {
      console.log('🔌', logMessage);
    } else if (step.includes('ITERATION')) {
      console.log('🔄', logMessage);
    } else if (step.includes('SCROLL')) {
      console.log('📜', logMessage);
    } else if (step.includes('READING')) {
      console.log('📖', logMessage);
    } else {
      console.log('✅', logMessage);
    }
  }

  getSessionLogs(sessionId) {
    return this.sessionLogs.get(sessionId) || [];
  }

  getAllSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.activeSessions) {
      sessions.push({
        id: sessionId,
        status: session.status,
        startTime: session.startTime,
        config: session.config,
        proxyCount: session.proxyList ? session.proxyList.length : 0
      });
    }
    return sessions;
  }

  stopSession(sessionId) {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId).status = 'stopped';
      this.log(sessionId, 'SESSION_STOPPED', 'Session dihentikan');
    }
  }

  stopAllSessions() {
    for (const [sessionId] of this.activeSessions) {
      this.stopSession(sessionId);
    }
    this.log('SYSTEM', 'ALL_SESSIONS_STOPPED', 'Semua sessions dihentikan');
  }

  clearAllSessions() {
    this.activeSessions.clear();
    this.sessionLogs.clear();
    this.log('SYSTEM', 'ALL_SESSIONS_CLEARED', 'Semua sessions dan logs dihapus');
  }

  getProxyStatus() {
    const totalProxies = this.proxyHandler.getRemainingCount();
    const qualityProxies = Array.from(this.proxyQuality.entries()).filter(([_, data]) => 
      ['EXCELLENT', 'GOOD', 'FAIR'].includes(data.quality)
    ).length;

    return {
      totalActive: totalProxies,
      qualityProxies: qualityProxies,
      message: `🔧 Proxy system: ${qualityProxies}/${totalProxies} quality proxies`
    };
  }

  // 🎯 SESSION MANAGEMENT
  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Menginisialisasi session baru dengan ENHANCED TIMEOUT SYSTEM...');
    
    let proxyList = [];
    
    if (config.proxySource === 'auto') {
      this.log(sessionId, 'PROXY_AUTO', 'Mengambil proxy gratis otomatis dengan quality check...');
      
      try {
        const proxyCount = config.proxyCount || 5;
        proxyList = await this.proxyScraper.getProxiesWithoutTest(proxyCount);
        
        if (proxyList.length > 0) {
          this.proxyHandler.addMultipleProxies(proxyList);
          
          // ✅ TEST PROXY QUALITY
          for (const proxy of proxyList.slice(0, 3)) {
            await this.testProxyQuality(proxy, sessionId);
          }
          
          this.log(sessionId, 'PROXY_AUTO_SUCCESS', `Berhasil mendapatkan ${proxyList.length} proxy dengan quality check`);
        } else {
          throw new Error('Tidak ada proxy yang berhasil diambil');
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_AUTO_ERROR', `Gagal: ${error.message}`);
        // Fallback ke backup proxies
        proxyList = this.proxyScraper.getBackupProxies();
        this.proxyHandler.addMultipleProxies(proxyList);
        this.log(sessionId, 'PROXY_BACKUP_USED', `Menggunakan ${proxyList.length} backup proxy`);
      }
    }
    else if (config.proxySource === 'manual' && config.proxyList && config.proxyList.length > 0) {
      this.log(sessionId, 'PROXY_MANUAL', `Memproses ${config.proxyList.length} proxy manual dengan quality check...`);
      
      const validProxies = config.proxyList.filter(proxy => proxy && proxy.trim() !== '');
      
      if (validProxies.length > 0) {
        this.proxyHandler.addMultipleProxies(validProxies);
        proxyList = validProxies;
        
        // ✅ TEST PROXY QUALITY
        for (const proxy of validProxies.slice(0, 3)) {
          await this.testProxyQuality(proxy, sessionId);
        }
        
        this.log(sessionId, 'PROXY_MANUAL_SUCCESS', `${validProxies.length} proxy manual ditambahkan dengan quality check`);
      } else {
        throw new Error('Tidak ada proxy manual yang valid');
      }
    }
    else {
      throw new Error('Proxy wajib digunakan');
    }

    if (proxyList.length === 0) {
      throw new Error('Tidak ada proxy yang tersedia');
    }

    this.sessionLogs.set(sessionId, []);
    this.activeSessions.set(sessionId, {
      id: sessionId,
      config: config,
      status: 'running',
      startTime: new Date(),
      proxyList: proxyList
    });

    this.log(sessionId, 'SESSION_STARTED', 
      `Session dimulai dengan ${proxyList.length} proxy (${this.getProxyStatus().qualityProxies} quality) menargetkan: ${config.targetUrl}` + 
      (config.isAutoLoop ? ' [AUTO-LOOP]' : ''));
    
    this.executeSessionWithRetry(sessionId, config).catch(error => {
      this.log(sessionId, 'SESSION_ERROR', `Session gagal: ${error.message}`);
      this.stopSession(sessionId);
    });

    return sessionId;
  }

  async executeSessionWithRetry(sessionId, config, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      await this.executeSession(sessionId, config);
    } catch (error) {
      if (retryCount < maxRetries) {
        this.log(sessionId, 'SESSION_RETRY', `Mencoba lagi... (${retryCount + 1}/${maxRetries})`);
        await this.waitForTimeout(8000);
        await this.executeSessionWithRetry(sessionId, config, retryCount + 1);
      } else {
        this.log(sessionId, 'SESSION_FAILED', `Session gagal setelah ${retryCount + 1} percobaan`);
        this.stopSession(sessionId);
      }
    }
  }
}

module.exports = TrafficGenerator;