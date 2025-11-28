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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ],
      mobile: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      ]
    };
  }

  getRandomUserAgent(deviceType) {
    const agents = this.userAgents[deviceType] || this.userAgents.desktop;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  formatProxyForBrowser(proxyUrl) {
    const proxyType = this.proxyScraper.detectProxyType(proxyUrl);
    
    if (proxyUrl.includes('://')) {
      const urlParts = proxyUrl.split('://');
      return urlParts[1];
    }
    
    return proxyUrl;
  }

  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Initializing new session...');
    
    let proxyList = [];
    
    if (config.proxySource === 'auto') {
      this.log(sessionId, 'PROXY_AUTO', 'Mengambil proxy gratis otomatis...');
      
      try {
        const proxyCount = config.proxyCount || 5;
        proxyList = await this.proxyScraper.getWorkingProxies(proxyCount);
        
        if (proxyList.length > 0) {
          this.proxyHandler.addMultipleProxies(proxyList);
          this.log(sessionId, 'PROXY_AUTO_SUCCESS', `Berhasil mendapatkan ${proxyList.length} proxy`);
        } else {
          throw new Error('Tidak ada proxy yang bekerja');
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_AUTO_ERROR', `Gagal: ${error.message}`);
        throw error;
      }
    }
    else if (config.proxySource === 'manual' && config.proxyList && config.proxyList.length > 0) {
      this.log(sessionId, 'PROXY_MANUAL', `Processing ${config.proxyList.length} manual proxies...`);
      
      // Test manual proxies
      const testPromises = config.proxyList.map(proxy => 
        this.proxyScraper.testProxyWithIPCheck(proxy)
      );
      const testResults = await Promise.all(testPromises);
      const workingProxies = testResults.filter(r => r.working).map(r => r.proxy);
      
      if (workingProxies.length > 0) {
        this.proxyHandler.addMultipleProxies(workingProxies);
        proxyList = workingProxies;
        this.log(sessionId, 'PROXY_MANUAL_SUCCESS', `${workingProxies.length} proxy berhasil`);
      } else {
        throw new Error('Tidak ada proxy manual yang bekerja');
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

    this.log(sessionId, 'SESSION_STARTED', `Session started dengan ${proxyList.length} proxy`);
    
    // Execute session
    this.executeSessionWithRetry(sessionId, config).catch(error => {
      this.log(sessionId, 'SESSION_ERROR', `Session failed: ${error.message}`);
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
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.executeSessionWithRetry(sessionId, config, retryCount + 1);
      } else {
        this.log(sessionId, 'SESSION_FAILED', `Session failed setelah ${retryCount + 1} attempts`);
        this.stopSession(sessionId);
      }
    }
  }

  async executeSession(sessionId, config) {
    let browser;
    let currentProxy = null;
    
    try {
      currentProxy = this.proxyScraper.getRandomActiveProxy();
      if (!currentProxy) {
        throw new Error('Tidak ada proxy aktif');
      }

      this.log(sessionId, 'PROXY_SELECTED', `Menggunakan proxy: ${currentProxy}`);

      this.log(sessionId, 'STEP_1', 'Launching browser dengan proxy...');
      browser = await this.launchBrowserWithProxy(config, currentProxy, 60000);
      
      const page = await browser.newPage();
      
      page.setDefaultTimeout(45000);
      page.setDefaultNavigationTimeout(60000);

      const userAgent = this.getRandomUserAgent(config.deviceType);
      await page.setUserAgent(userAgent);
      
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

      this.log(sessionId, 'STEP_1_COMPLETE', 'Browser launched');

      this.log(sessionId, 'STEP_2', `Navigating ke: ${config.targetUrl}`);
      
      try {
        const response = await page.goto(config.targetUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        
        this.log(sessionId, 'STEP_2_COMPLETE', 'Berhasil navigasi ke target URL');

        await this.executeAllSteps(page, sessionId, config);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua steps completed successfully');

      } catch (navError) {
        this.log(sessionId, 'NAVIGATION_ERROR', `Navigation gagal: ${navError.message}`);
        throw navError;
      }

    } catch (error) {
      this.log(sessionId, 'EXECUTION_ERROR', `Error: ${error.message}`);
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.log(sessionId, 'BROWSER_CLOSED', 'Browser closed');
        } catch (closeError) {
          this.log(sessionId, 'BROWSER_CLOSE_ERROR', `Error: ${closeError.message}`);
        }
      }
    }
  }

  async launchBrowserWithProxy(config, proxyUrl, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Browser launch timeout`));
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
      '--disable-web-security',
      '--disable-features=site-per-process',
      `--proxy-server=${this.formatProxyForBrowser(proxyUrl)}`
    ];

    const launchOptions = {
      headless: "new",
      args: args,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      ignoreHTTPSErrors: true,
      timeout: 60000
    };

    return await puppeteer.launch(launchOptions);
  }

  async executeAllSteps(page, sessionId, config) {
    const steps = [
      {
        name: 'STEP_3',
        action: async () => {
          this.log(sessionId, 'STEP_3', 'Starting human-like scroll...');
          await this.humanScroll(page);
        },
        successMessage: 'Scroll completed',
        timeout: 30000
      },
      {
        name: 'STEP_4', 
        action: async () => {
          this.log(sessionId, 'STEP_4', 'Looking for random link...');
          const clicked = await this.clickRandomLink(page);
          if (!clicked) {
            this.log(sessionId, 'STEP_4_SKIP', 'No links found');
          }
        },
        successMessage: 'Random click completed',
        timeout: 15000
      },
      {
        name: 'STEP_5',
        action: async () => {
          this.log(sessionId, 'STEP_5', 'Checking for ads...');
          await this.skipGoogleAds(page);
        },
        successMessage: 'Ads handled',
        timeout: 10000
      },
      {
        name: 'STEP_6',
        action: async () => {
          this.log(sessionId, 'STEP_6', 'Continuing reading...');
          await this.humanScroll(page);
        },
        successMessage: 'Continued reading',
        timeout: 30000
      }
    ];

    for (const step of steps) {
      try {
        await Promise.race([
          step.action(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Step timeout`)), step.timeout)
          )
        ]);
        
        this.log(sessionId, `${step.name}_COMPLETE`, step.successMessage);
        await page.waitForTimeout(2000);
        
      } catch (stepError) {
        this.log(sessionId, `${step.name}_ERROR`, `Step failed: ${stepError.message}`);
      }
    }
  }

  // MISSING METHODS - NOW ADDED:
  async humanScroll(page) {
    try {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
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
            return href && 
                   !href.includes('#') && 
                   !href.startsWith('javascript:') &&
                   href !== window.location.href;
          })
          .map(a => a.href)
      );
      
      if (links.length > 0) {
        const randomLink = links[Math.floor(Math.random() * links.length)];
        await page.goto(randomLink, { waitUntil: 'domcontentloaded' });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async skipGoogleAds(page) {
    try {
      const skipSelectors = [
        'button[aria-label="Skip ad"]',
        '.videoAdUiSkipButton',
        '.ytp-ad-skip-button'
      ];
      
      for (const selector of skipSelectors) {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await page.waitForTimeout(1000);
          return true;
        }
      }
      return false;
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
    
    console.log(`[${sessionId}] ${step}: ${message}`);
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
      this.log(sessionId, 'SESSION_STOPPED', 'Session stopped');
    }
  }

  stopAllSessions() {
    for (const [sessionId] of this.activeSessions) {
      this.stopSession(sessionId);
    }
  }

  clearAllSessions() {
    this.activeSessions.clear();
    this.sessionLogs.clear();
  }

  setAutoRestart(enabled) {
    this.autoRestartEnabled = enabled;
  }

  getProxyStatus() {
    return this.proxyScraper.getStatus();
  }
}

module.exports = TrafficGenerator;