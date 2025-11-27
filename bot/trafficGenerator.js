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
    
    // Extended User Agents Database
    this.userAgents = {
      desktop: [
        // Windows - Chrome
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        
        // Windows - Firefox
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
        
        // Windows - Edge
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
        
        // macOS - Safari
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
        
        // macOS - Chrome
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        
        // Linux - Chrome
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        
        // Linux - Firefox
        'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ],
      mobile: [
        // iOS - Safari
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        
        // iOS - Chrome
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        
        // Android - Chrome
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 11; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        
        // Android - Samsung Browser
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/20.0 Chrome/106.0.5249.126 Mobile Safari/537.36',
        
        // Android - Firefox
        'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
        'Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
        
        // Android - Opera
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 OPR/80.0.4170.63',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 OPR/79.0.4143.73',
        
        // Xiaomi Devices
        'Mozilla/5.0 (Linux; Android 13; 2201122G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; M2101K7AG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        
        // Huawei Devices
        'Mozilla/5.0 (Linux; Android 12; LIO-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 11; MAR-LX1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        
        // OnePlus Devices
        'Mozilla/5.0 (Linux; Android 13; CPH2581) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; NE2215) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      ]
    };
  }

  getRandomUserAgent(deviceType) {
    const agents = this.userAgents[deviceType] || this.userAgents.desktop;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  formatProxyForPuppeteer(proxyUrl) {
    const proxyType = this.proxyScraper.detectProxyType(proxyUrl);
    
    if (proxyType.includes('socks')) {
      const matches = proxyUrl.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})/);
      if (matches) {
        return matches[0];
      }
    }
    
    if (proxyUrl.includes('://')) {
      const urlParts = proxyUrl.split('://');
      return urlParts[1];
    }
    
    return proxyUrl;
  }

  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Initializing new session dengan adaptive timeout proxy system...');
    
    let proxyList = [];
    
    if (config.proxySource === 'auto') {
      this.log(sessionId, 'PROXY_AUTO', 'Mengambil proxy dengan adaptive timeout testing...');
      
      try {
        const proxyCount = config.proxyCount || 5;
        proxyList = await this.proxyScraper.getWorkingProxies(proxyCount);
        
        if (proxyList.length > 0) {
          this.proxyHandler.addMultipleProxies(proxyList);
          this.log(sessionId, 'PROXY_AUTO_SUCCESS', 
            `Berhasil mendapatkan ${proxyList.length} proxy aktif dengan adaptive timeout`);
          
          proxyList.forEach((proxy, index) => {
            const proxyData = this.proxyScraper.activeProxies.get(proxy);
            const info = proxyData ? `(IP: ${proxyData.ip}, Tipe: ${proxyData.type.toUpperCase()}, Kecepatan: ${proxyData.speedCategory}, Timeout: ${proxyData.optimalTimeout/1000}s)` : '';
            this.log(sessionId, 'PROXY_DETAIL', `${index + 1}. ${proxy} ${info}`);
          });
        } else {
          this.log(sessionId, 'PROXY_AUTO_FAILED', 'Auto proxy gagal, mencoba backup...');
          proxyList = await this.fallbackToBackupProxies(config, sessionId);
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_AUTO_ERROR', `Error: ${error.message}, fallback ke backup`);
        proxyList = await this.fallbackToBackupProxies(config, sessionId);
      }
    } 
    else if (config.proxySource === 'manual' && config.proxyList && config.proxyList.length > 0) {
      this.log(sessionId, 'PROXY_MANUAL', `Testing ${config.proxyList.length} manual proxies dengan adaptive timeout...`);
      
      const testPromises = config.proxyList.map(proxy => 
        this.proxyScraper.basicPingTest(proxy)
      );
      const testResults = await Promise.all(testPromises);
      const workingProxies = testResults.filter(r => r.working).map(r => r.proxy);
      
      if (workingProxies.length > 0) {
        this.proxyHandler.addMultipleProxies(workingProxies);
        proxyList = workingProxies;
        this.log(sessionId, 'PROXY_MANUAL_SUCCESS', 
          `${workingProxies.length}/${config.proxyList.length} proxy manual berhasil dengan adaptive timeout`);
        
        const fastCount = workingProxies.filter(p => {
          const data = this.proxyScraper.activeProxies.get(p);
          return data && data.speedCategory === 'FAST';
        }).length;
        const mediumCount = workingProxies.filter(p => {
          const data = this.proxyScraper.activeProxies.get(p);
          return data && data.speedCategory === 'MEDIUM';
        }).length;
        const slowCount = workingProxies.filter(p => {
          const data = this.proxyScraper.activeProxies.get(p);
          return data && data.speedCategory === 'SLOW';
        }).length;
        const verySlowCount = workingProxies.filter(p => {
          const data = this.proxyScraper.activeProxies.get(p);
          return data && data.speedCategory === 'VERY_SLOW';
        }).length;
        
        this.log(sessionId, 'PROXY_SPEED_SUMMARY', `FAST: ${fastCount}, MEDIUM: ${mediumCount}, SLOW: ${slowCount}, VERY_SLOW: ${verySlowCount}`);
      } else {
        this.log(sessionId, 'PROXY_MANUAL_FAILED', 'Tidak ada proxy manual yang bekerja, fallback...');
        proxyList = await this.fallbackToBackupProxies(config, sessionId);
      }
    }
    else {
      this.log(sessionId, 'PROXY_REQUIRED', 'Proxy wajib digunakan, menggunakan backup...');
      proxyList = await this.fallbackToBackupProxies(config, sessionId);
    }

    if (proxyList.length === 0) {
      this.log(sessionId, 'NO_PROXY_AVAILABLE', 'TIDAK ADA PROXY YANG TERSEDIA! Session dibatalkan.');
      throw new Error('Tidak ada proxy yang tersedia untuk session ini.');
    }

    this.sessionLogs.set(sessionId, []);
    this.activeSessions.set(sessionId, {
      id: sessionId,
      config: config,
      status: 'running',
      startTime: new Date(),
      currentStep: 0,
      isAutoLoop: config.isAutoLoop || false,
      restartCount: 0,
      maxRestarts: config.maxRestarts || 3,
      proxyList: proxyList
    });

    this.log(sessionId, 'SESSION_STARTED', 
      `Session started dengan ${config.profileCount} profiles targeting: ${config.targetUrl}` +
      ` menggunakan ${proxyList.length} proxy aktif (Adaptive Timeout)` +
      (config.isAutoLoop ? ' [AUTO-LOOP]' : '')
    );
    
    this.executeSessionWithRetry(sessionId, config).catch(error => {
      this.log(sessionId, 'SESSION_ERROR', `Session failed: ${error.message}`);
      this.stopSession(sessionId);
    });

    return sessionId;
  }

  async fallbackToBackupProxies(config, sessionId) {
    this.log(sessionId, 'PROXY_FALLBACK', 'Menggunakan backup proxies dengan adaptive timeout...');
    
    let backupList = [];
    
    if (config.backupProxies && config.backupProxies.length > 0) {
      const testPromises = config.backupProxies.map(proxy => 
        this.proxyScraper.basicPingTest(proxy)
      );
      const testResults = await Promise.all(testPromises);
      backupList = testResults.filter(r => r.working).map(r => r.proxy);
      
      if (backupList.length > 0) {
        this.log(sessionId, 'BACKUP_SUCCESS', `${backupList.length} backup proxies berhasil`);
      } else {
        this.log(sessionId, 'BACKUP_FAILED', 'Backup proxies gagal, menggunakan default backup');
        backupList = this.proxyScraper.getBackupProxies();
      }
    } else {
      this.log(sessionId, 'BACKUP_DEFAULT', 'Menggunakan default backup proxies');
      backupList = this.proxyScraper.getBackupProxies();
    }
    
    return backupList;
  }

  async executeSessionWithRetry(sessionId, config, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      await this.executeSession(sessionId, config);
    } catch (error) {
      const isProxyError = error.message.includes('proxy') || 
                          error.message.includes('ECONNREFUSED') ||
                          error.message.includes('TIMED_OUT') ||
                          error.message.includes('NETWORK') ||
                          error.message.includes('SOCKS');
      
      if (isProxyError && retryCount < maxRetries) {
        this.log(sessionId, 'PROXY_RETRY', 
          `Proxy error, mencoba proxy lain... (${retryCount + 1}/${maxRetries})`);
        
        const newProxy = this.proxyScraper.getProxyWithOptimalTimeout();
        if (newProxy) {
          this.log(sessionId, 'NEW_PROXY', 
            `Menggunakan proxy baru: ${newProxy.proxyUrl} (${newProxy.proxyData.speedCategory} - ${newProxy.proxyData.optimalTimeout/1000}s)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          await this.executeSessionWithRetry(sessionId, config, retryCount + 1);
        } else {
          this.log(sessionId, 'NO_MORE_PROXIES', 'Tidak ada proxy lain yang tersedia');
          this.stopSession(sessionId);
        }
      } else {
        this.log(sessionId, 'SESSION_FAILED', 
          `Session failed setelah ${retryCount + 1} attempts: ${error.message}`);
        this.stopSession(sessionId);
      }
    }
  }

  async executeSession(sessionId, config) {
    let browser;
    let currentProxy = null;
    let proxyTimeout = 60000; // Default timeout
    
    try {
      // Dapatkan proxy dengan timeout optimal
      const proxyInfo = this.proxyScraper.getProxyWithOptimalTimeout();
      if (!proxyInfo) {
        throw new Error('Tidak ada proxy aktif yang tersedia');
      }

      currentProxy = proxyInfo.proxyUrl;
      proxyTimeout = proxyInfo.proxyData.optimalTimeout;
      const proxyType = this.proxyScraper.detectProxyType(currentProxy);

      this.log(sessionId, 'PROXY_SELECTED', 
        `Menggunakan proxy: ${currentProxy} (${proxyType.toUpperCase()}) - ` +
        `Kategori: ${proxyInfo.proxyData.speedCategory} - ` +
        `Response: ${proxyInfo.proxyData.speed}ms - ` +
        `Timeout: ${proxyTimeout/1000}s`);

      this.log(sessionId, 'STEP_1', `Launching browser dengan adaptive timeout ${proxyTimeout/1000} detik...`);
      browser = await this.launchBrowserWithProxy(config, currentProxy, proxyTimeout);
      
      const page = await browser.newPage();
      
      // Set timeout berdasarkan kecepatan proxy
      page.setDefaultTimeout(proxyTimeout);
      page.setDefaultNavigationTimeout(proxyTimeout);

      // Gunakan random user agent dari database
      const userAgent = this.getRandomUserAgent(config.deviceType);
      await page.setUserAgent(userAgent);
      
      this.log(sessionId, 'USER_AGENT', `Menggunakan User Agent: ${userAgent.substring(0, 80)}...`);
      
      await page.setViewport({ 
        width: config.deviceType === 'mobile' ? 375 : 1280, 
        height: config.deviceType === 'mobile' ? 667 : 720 
      });

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      this.log(sessionId, 'STEP_1_COMPLETE', 
        `Browser launched dengan ${config.deviceType} user agent dan ${proxyType.toUpperCase()} proxy`);

      this.log(sessionId, 'STEP_2', 
        `Navigating ke: ${config.targetUrl} dengan adaptive timeout ${proxyTimeout/1000} detik...`);
      
      try {
        const response = await page.goto(config.targetUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: proxyTimeout
        });
        
        if (!response) {
          this.log(sessionId, 'NAVIGATION_WARNING', 'Navigation completed but no response object');
        } else if (!response.ok() && response.status() !== 304) {
          this.log(sessionId, 'NAVIGATION_WARNING', 
            `Navigation completed dengan status: ${response.status()} ${response.statusText()}`);
        }

        this.log(sessionId, 'STEP_2_COMPLETE', 
          `Berhasil navigasi ke target URL dengan ${proxyType.toUpperCase()} proxy dan adaptive timeout`);

        await this.executeAllSteps(page, sessionId, config, proxyTimeout);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua steps completed successfully dengan adaptive timeout');

      } catch (navError) {
        this.log(sessionId, 'NAVIGATION_ERROR', 
          `Navigation gagal dengan adaptive timeout ${proxyTimeout/1000}s: ${navError.message}`);
        if (currentProxy) {
          this.proxyScraper.markProxyAsFailed(currentProxy);
        }
        throw navError;
      }

    } catch (error) {
      this.log(sessionId, 'EXECUTION_ERROR', 
        `Error selama session execution: ${error.message}`);
      if (currentProxy) {
        this.proxyScraper.markProxyAsFailed(currentProxy);
      }
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.log(sessionId, 'BROWSER_CLOSED', 'Browser closed successfully');
        } catch (closeError) {
          this.log(sessionId, 'BROWSER_CLOSE_ERROR', 
            `Error closing browser: ${closeError.message}`);
        }
      }
    }
  }

  async launchBrowserWithProxy(config, proxyUrl, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Browser launch timeout setelah ${timeout}ms dengan proxy ${proxyUrl}`));
      }, timeout);

      try {
        const browser = await this.launchBrowser(config, proxyUrl);
        clearTimeout(timeoutId);
        resolve(browser);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  async launchBrowser(config, proxyUrl) {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--lang=en-US,en;q=0.9',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-web-security',
      '--disable-features=site-per-process',
      '--window-size=1920,1080'
    ];

    const puppeteerProxy = this.formatProxyForPuppeteer(proxyUrl);
    args.push(`--proxy-server=${puppeteerProxy}`);

    const launchOptions = {
      headless: "new",
      args: args,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000
    };

    const proxyType = this.proxyScraper.detectProxyType(proxyUrl);
    console.log(`Launching browser dengan ${proxyType.toUpperCase()} proxy:`, puppeteerProxy);

    return await puppeteer.launch(launchOptions);
  }

  getStepTimeoutMultiplier(proxyTimeout) {
    if (proxyTimeout <= 30000) return 1.0;      // FAST
    if (proxyTimeout <= 45000) return 1.2;      // MEDIUM  
    if (proxyTimeout <= 60000) return 1.5;      // SLOW
    return 2.0;                                 // VERY_SLOW
  }

  async executeAllSteps(page, sessionId, config, proxyTimeout) {
    // Sesuaikan timeout steps berdasarkan kecepatan proxy
    const stepMultiplier = this.getStepTimeoutMultiplier(proxyTimeout);
    
    const steps = [
      {
        name: 'STEP_3',
        action: async () => {
          this.log(sessionId, 'STEP_3', 'Starting human-like scroll simulation...');
          await this.humanScroll(page);
        },
        successMessage: 'Scroll simulation completed',
        timeout: 30000 * stepMultiplier
      },
      {
        name: 'STEP_4', 
        action: async () => {
          this.log(sessionId, 'STEP_4', 'Looking for random post to click...');
          const clicked = await this.clickRandomLink(page);
          if (!clicked) {
            this.log(sessionId, 'STEP_4_SKIP', 'No suitable links found, skipping click step');
          }
        },
        successMessage: 'Random click completed',
        timeout: 15000 * stepMultiplier
      },
      {
        name: 'STEP_5',
        action: async () => {
          this.log(sessionId, 'STEP_5', 'Checking for Google ads...');
          await this.skipGoogleAds(page);
        },
        successMessage: 'Ads handled',
        timeout: 10000 * stepMultiplier
      },
      {
        name: 'STEP_GOOGLE_ADS',
        action: async () => {
          this.log(sessionId, 'STEP_GOOGLE_ADS', 'Attempting to click Google ads...');
          const adClicked = await this.clickGoogleAdsAndReturn(page, sessionId, config.targetUrl, proxyTimeout);
          if (!adClicked) {
            this.log(sessionId, 'STEP_GOOGLE_ADS_SKIP', 'No Google ads found, skipping ad click step');
          }
        },
        successMessage: 'Google ads process completed',
        timeout: 60000 * stepMultiplier
      },
      {
        name: 'STEP_6',
        action: async () => {
          this.log(sessionId, 'STEP_6', 'Continuing reading with scroll after ads...');
          await this.humanScroll(page);
        },
        successMessage: 'Continued reading completed',
        timeout: 30000 * stepMultiplier
      },
      {
        name: 'STEP_7',
        action: async () => {
          this.log(sessionId, 'STEP_7', 'Returning to home...');
          await this.clickHome(page);
        },
        successMessage: 'Returned to home',
        timeout: 15000 * stepMultiplier
      },
      {
        name: 'STEP_8',
        action: async () => {
          this.log(sessionId, 'STEP_8', 'Clearing cache...');
          await this.clearCache(page);
        },
        successMessage: 'Cache cleared',
        timeout: 5000 * stepMultiplier
      }
    ];

    for (const step of steps) {
      try {
        await Promise.race([
          step.action(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Step ${step.name} timeout setelah ${step.timeout/1000}s`)), step.timeout)
          )
        ]);
        
        this.log(sessionId, `${step.name}_COMPLETE`, step.successMessage);
        
        await page.waitForTimeout(Math.random() * 3000 + 2000);
        
      } catch (stepError) {
        this.log(sessionId, `${step.name}_ERROR`, 
          `Step failed but continuing: ${stepError.message}`);
      }
    }
  }

  async humanScroll(page) {
    try {
      const viewportHeight = page.viewport().height;
      let scrollHeight = 0;
      
      const totalHeight = await page.evaluate(() => document.body.scrollHeight);
      const scrollableHeight = totalHeight - viewportHeight;
      
      const targetScrollHeight = scrollableHeight * 0.8;
      
      while (scrollHeight < targetScrollHeight) {
        const scrollAmount = Math.floor(Math.random() * 200) + 100;
        scrollHeight = Math.min(scrollHeight + scrollAmount, targetScrollHeight);
        
        await page.evaluate((scrollTo) => {
          window.scrollTo(0, scrollTo);
        }, scrollHeight);
        
        await page.waitForTimeout(Math.random() * 2000 + 1000);
      }
      
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log('Scroll error:', error.message);
    }
  }

  async clickRandomLink(page) {
    try {
      const links = await page.$$eval('a[href]', anchors => 
        anchors
          .filter(a => {
            const href = a.href;
            const text = a.textContent.trim();
            return href && 
                   !href.includes('#') && 
                   !href.startsWith('javascript:') &&
                   !href.includes('mailto:') &&
                   !href.includes('tel:') &&
                   href !== window.location.href &&
                   text.length > 0 &&
                   a.offsetWidth > 0 &&
                   a.offsetHeight > 0;
          })
          .map(a => ({ 
            href: a.href, 
            text: a.textContent.trim().substring(0, 50) 
          }))
      );
      
      if (links.length > 0) {
        const randomLink = links[Math.floor(Math.random() * links.length)];
        
        await page.evaluate((href) => {
          const link = document.querySelector(`a[href="${href}"]`);
          if (link) {
            const rect = link.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const mouseDown = new MouseEvent('mousedown', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            
            const mouseUp = new MouseEvent('mouseup', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            
            const click = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            
            link.dispatchEvent(mouseDown);
            link.dispatchEvent(mouseUp);
            link.dispatchEvent(click);
          }
        }, randomLink.href);
        
        await page.waitForTimeout(3000);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Cannot click link:', error.message);
      return false;
    }
  }

  async skipGoogleAds(page) {
    try {
      const skipSelectors = [
        'button[aria-label="Skip ad"]',
        '.videoAdUiSkipButton',
        '.ytp-ad-skip-button',
        'div.skip-ad-button',
        'button[class*="skip"]',
        '.ad-skip-button',
        '[data-adskip]'
      ];
      
      for (const selector of skipSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await page.waitForTimeout(1000);
            return true;
          }
        } catch (e) {
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async clickGoogleAdsAndReturn(page, sessionId, targetUrl, proxyTimeout) {
    try {
      this.log(sessionId, 'GOOGLE_ADS_START', 
        `Looking for Google ads dengan adaptive timeout ${proxyTimeout/1000} detik...`);
      
      const adSelectors = [
        'a[href*="googleadservices.com"]',
        'a[href*="doubleclick.net"]',
        'div[id*="google_ads"]',
        'ins.adsbygoogle',
        '.google-ad',
        '[data-google-query-id]',
        'a[onclick*="google"]',
        '.ad-container',
        '.advertisement',
        '.ad-unit',
        'a[href*="googlesyndication.com"]',
        '.adsbygoogle',
        '[id*="ad-container"]',
        '.ad-slot',
        '[data-ad-client]',
        '[data-ad-slot]'
      ];

      let adClicked = false;
      
      for (const selector of adSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            this.log(sessionId, 'ADS_FOUND', 
              `Found ${elements.length} elements dengan selector: ${selector}`);
            
            const visibleElements = [];
            for (const element of elements) {
              const isVisible = await page.evaluate(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && 
                       el.offsetParent !== null &&
                       el.style.display !== 'none' &&
                       el.style.visibility !== 'hidden' &&
                       el.style.opacity !== '0';
              }, element);
              
              if (isVisible) {
                visibleElements.push(element);
              }
            }
            
            if (visibleElements.length > 0) {
              const randomAd = visibleElements[Math.floor(Math.random() * visibleElements.length)];
              
              const adUrl = await page.evaluate(el => {
                if (el.tagName === 'A') return el.href;
                const link = el.closest('a');
                return link ? link.href : null;
              }, randomAd);
              
              if (adUrl && (adUrl.includes('google') || adUrl.includes('doubleclick'))) {
                this.log(sessionId, 'AD_CLICK_ATTEMPT', 
                  `Attempting to click ad dengan URL: ${adUrl.substring(0, 100)}...`);
                
                await page.evaluate(el => {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, randomAd);
                
                await page.waitForTimeout(2000);
                
                await randomAd.click();
                adClicked = true;
                
                await page.waitForTimeout(5000);
                
                this.log(sessionId, 'AD_CLICKED', 'Successfully clicked Google ad');
                
                const randomDuration = Math.floor(Math.random() * 20000) + 10000;
                this.log(sessionId, 'AD_PAGE_WAIT', 
                  `Staying on ad page for ${randomDuration/1000} seconds`);
                
                await this.humanActivityOnAdPage(page, randomDuration);
                
                this.log(sessionId, 'RETURN_TO_TARGET', 
                  `Returning to target website dengan adaptive timeout ${proxyTimeout/1000}s...`);
                await page.goto(targetUrl, { 
                  waitUntil: 'domcontentloaded',
                  timeout: proxyTimeout 
                });
                
                this.log(sessionId, 'RETURN_COMPLETE', 'Successfully returned to target website');
                break;
              }
            }
          }
        } catch (error) {
          this.log(sessionId, 'AD_CLICK_ERROR', 
            `Failed to click ad dengan selector ${selector}: ${error.message}`);
        }
      }
      
      if (!adClicked) {
        this.log(sessionId, 'NO_ADS_FOUND', 'No Google ads found to click');
      }
      
      return adClicked;
    } catch (error) {
      this.log(sessionId, 'ADS_PROCESS_ERROR', 
        `Error in ad click process: ${error.message}`);
      return false;
    }
  }

  async humanActivityOnAdPage(page, duration) {
    try {
      const startTime = Date.now();
      
      while (Date.now() - startTime < duration) {
        const scrollAmount = Math.floor(Math.random() * 300) + 100;
        await page.evaluate((scroll) => {
          window.scrollBy(0, scroll);
        }, scrollAmount);
        
        const waitTime = Math.random() * 3000 + 2000;
        await page.waitForTimeout(waitTime);
        
        if (Math.random() > 0.7) {
          await page.evaluate(() => {
            window.scrollBy(0, -200);
          });
          await page.waitForTimeout(1000);
        }
        
        if (Math.random() > 0.75) {
          const links = await page.$$('a[href]');
          if (links.length > 0) {
            const randomLink = links[Math.floor(Math.random() * links.length)];
            try {
              await randomLink.click();
              await page.waitForTimeout(3000);
              await page.goBack();
              await page.waitForTimeout(2000);
            } catch (e) {
            }
          }
        }
      }
    } catch (error) {
    }
  }

  async clickHome(page) {
    try {
      const homeSelectors = [
        'a[href="/"]',
        'a[href*="home"]',
        '.home-button',
        '.navbar-brand',
        'header a',
        'a.logo',
        '[data-testid="home-link"]',
        '.navbar-home',
        '[title="Home"]'
      ];
      
      for (const selector of homeSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await page.waitForTimeout(2000);
            return true;
          }
        } catch (e) {
        }
      }
      
      const currentUrl = page.url();
      const baseUrl = new URL(currentUrl).origin;
      await page.goto(baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      return true;
      
    } catch (error) {
      return false;
    }
  }

  async clearCache(page) {
    try {
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        } catch (e) {
        }
      });
      
      return true;
    } catch (error) {
      return false;
    }
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
    } else if (step.includes('PROXY')) {
      console.log('🔌', logMessage);
    } else if (step.includes('USER_AGENT')) {
      console.log('👤', logMessage);
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
        currentStep: session.currentStep,
        config: session.config,
        isAutoLoop: session.isAutoLoop,
        restartCount: session.restartCount,
        maxRestarts: session.maxRestarts,
        proxyCount: session.proxyList ? session.proxyList.length : 0
      });
    }
    return sessions;
  }

  stopSession(sessionId) {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId).status = 'stopped';
      this.log(sessionId, 'SESSION_STOPPED', 'Session stopped');
    }
  }

  stopAllSessions() {
    for (const [sessionId] of this.activeSessions) {
      this.stopSession(sessionId);
    }
    this.log('SYSTEM', 'ALL_SESSIONS_STOPPED', 'All sessions stopped');
  }

  clearAllSessions() {
    this.activeSessions.clear();
    this.sessionLogs.clear();
    this.log('SYSTEM', 'ALL_SESSIONS_CLEARED', 'All sessions and logs cleared');
  }

  setAutoRestart(enabled) {
    this.autoRestartEnabled = enabled;
    console.log(`🔄 Auto-restart ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  getProxyStatus() {
    return this.proxyScraper.getStatus();
  }
}

module.exports = TrafficGenerator;