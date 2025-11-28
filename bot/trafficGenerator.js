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
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ],
      mobile: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 11; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/20.0 Chrome/106.0.5249.126 Mobile Safari/537.36',
        'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
        'Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 OPR/80.0.4170.63',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 OPR/79.0.4143.73',
        'Mozilla/5.0 (Linux; Android 13; 2201122G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; M2101K7AG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; LIO-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 11; MAR-LX1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; CPH2581) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; NE2215) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      ]
    };
  }

  getRandomUserAgent(deviceType) {
    const agents = this.userAgents[deviceType] || this.userAgents.desktop;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  // 🆕 FORMAT PROXY UNTUK BROWSER LAUNCH
  formatProxyForBrowser(proxyUrl) {
    const proxyType = this.proxyScraper.detectProxyType(proxyUrl);
    
    // Untuk browser launch, kita butuh format IP:PORT tanpa protocol
    if (proxyUrl.includes('://')) {
      const urlParts = proxyUrl.split('://');
      return urlParts[1]; // Ambil bagian setelah ://
    }
    
    return proxyUrl;
  }

  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Initializing new session dengan AUTO-SWITCH PROXY...');
    
    let proxyList = [];
    
    if (config.proxySource === 'auto') {
      this.log(sessionId, 'PROXY_AUTO', 'Mengambil proxy TANPA TEST AWAL...');
      
      try {
        const proxyCount = config.proxyCount || 5;
        proxyList = await this.proxyScraper.getProxiesWithoutTest(proxyCount);
        
        if (proxyList.length > 0) {
          this.proxyHandler.addMultipleProxies(proxyList);
          this.log(sessionId, 'PROXY_AUTO_SUCCESS', 
            `✅ ${proxyList.length} proxy siap digunakan TANPA TEST`);
        } else {
          this.log(sessionId, 'PROXY_AUTO_FAILED', 'Auto proxy gagal, menggunakan backup...');
          proxyList = await this.fallbackToBackupProxies(config, sessionId);
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_AUTO_ERROR', `Error: ${error.message}, fallback ke backup`);
        proxyList = await this.fallbackToBackupProxies(config, sessionId);
      }
    } 
    else if (config.proxySource === 'manual' && config.proxyList && config.proxyList.length > 0) {
      this.log(sessionId, 'PROXY_MANUAL', `✅ Menggunakan ${config.proxyList.length} manual proxies TANPA TEST`);
      
      // 🆕 TIDAK ADA TEST - langsung gunakan
      proxyList = config.proxyList.map(proxy => {
        const authProxy = this.proxyHandler.parseProxyWithAuth(proxy);
        return authProxy || proxy;
      }).filter(proxy => proxy !== null);
      
      this.proxyHandler.addMultipleProxies(proxyList);
      this.log(sessionId, 'PROXY_READY', `${proxyList.length} proxy siap digunakan`);
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
      proxyList: proxyList,
      usedProxies: [], // 🆕 Track proxy yang sudah dicoba
      currentProxyIndex: 0
    });

    this.log(sessionId, 'SESSION_STARTED', 
      `🚀 Session started dengan ${config.profileCount} profiles` +
      ` menggunakan ${proxyList.length} proxy (AUTO-SWITCH MODE)` +
      (config.isAutoLoop ? ' [AUTO-LOOP]' : '')
    );
    
    this.executeSessionWithAutoSwitch(sessionId, config).catch(error => {
      this.log(sessionId, 'SESSION_ERROR', `Session failed: ${error.message}`);
      this.stopSession(sessionId);
    });

    return sessionId;
  }

  // 🆕 METHOD BARU: Execute dengan auto-switch proxy
  async executeSessionWithAutoSwitch(sessionId, config) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.log(sessionId, 'SESSION_NOT_FOUND', 'Session tidak ditemukan');
      return;
    }

    let success = false;
    let attempts = 0;
    const maxAttempts = session.proxyList.length;

    while (!success && attempts < maxAttempts && session.status === 'running') {
      attempts++;
      
      // Dapatkan proxy berikutnya
      const proxy = this.getNextProxy(sessionId);
      if (!proxy) {
        this.log(sessionId, 'NO_MORE_PROXIES', 'Tidak ada proxy lagi yang tersedia');
        break;
      }

      this.log(sessionId, 'PROXY_ATTEMPT', `Mencoba proxy ${attempts}/${maxAttempts}: ${proxy}`);

      try {
        await this.executeWithProxy(sessionId, config, proxy);
        success = true;
        this.log(sessionId, 'SESSION_SUCCESS', `✅ Session berhasil dengan proxy: ${proxy}`);
      } catch (error) {
        this.log(sessionId, 'PROXY_FAILED', `❌ Proxy gagal: ${proxy} - ${error.message}`);
        
        // Hapus proxy yang gagal dari list
        this.proxyHandler.removeFailedProxy(proxy);
        session.usedProxies.push(proxy);
        
        // Tunggu sebentar sebelum coba proxy berikutnya
        if (attempts < maxAttempts) {
          this.log(sessionId, 'SWITCH_PROXY', `🔄 Switching ke proxy berikutnya dalam 3 detik...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    if (!success) {
      this.log(sessionId, 'ALL_PROXIES_FAILED', '❌ Semua proxy gagal. Session dihentikan.');
      this.stopSession(sessionId);
    }
  }

  // 🆕 METHOD: Dapatkan proxy berikutnya
  getNextProxy(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.currentProxyIndex >= session.proxyList.length) {
      return null;
    }

    const proxy = session.proxyList[session.currentProxyIndex];
    session.currentProxyIndex++;
    return proxy;
  }

  // 🆕 METHOD: Execute dengan proxy tertentu
  async executeWithProxy(sessionId, config, proxyUrl) {
    let browser;
    
    try {
      this.log(sessionId, 'BROWSER_START', `Launching browser dengan proxy: ${proxyUrl}`);
      
      // 🆕 LAUNCH BROWSER DENGAN TIMEOUT 60 DETIK
      browser = await this.launchBrowserWithProxy(config, proxyUrl, 60000);
      
      const page = await browser.newPage();
      
      // Set timeout 60 detik
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);

      // Gunakan random user agent
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

      this.log(sessionId, 'STEP_1_COMPLETE', `Browser launched dengan ${config.deviceType} user agent`);

      // 🆕 CEK IP SEBELUM TARGET URL
      this.log(sessionId, 'IP_CHECK', `Memeriksa IP dengan proxy...`);
      
      try {
        const ipResponse = await page.goto('https://httpbin.org/ip', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        if (ipResponse && ipResponse.status() === 200) {
          const ipData = await page.evaluate(() => document.body.textContent());
          let ipInfo;
          try {
            ipInfo = JSON.parse(ipData);
            this.log(sessionId, 'IP_DETECTED', `🌐 IP Terdeteksi: ${ipInfo.origin}`);
          } catch (e) {
            this.log(sessionId, 'IP_UNKNOWN', '🌐 IP tidak bisa dideteksi (format JSON invalid)');
          }
        }
      } catch (ipError) {
        this.log(sessionId, 'IP_CHECK_FAILED', `Peringatan: Cek IP gagal, tetapi melanjutkan...`);
      }

      this.log(sessionId, 'STEP_2', `Membuka target URL: ${config.targetUrl}`);
      
      // BUKA TARGET URL DENGAN TIMEOUT 60 DETIK
      const response = await page.goto(config.targetUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      if (!response) {
        this.log(sessionId, 'NAVIGATION_WARNING', 'Navigation completed but no response object');
      } else if (!response.ok() && response.status() !== 304) {
        this.log(sessionId, 'NAVIGATION_WARNING', 
          `Navigation completed dengan status: ${response.status()} ${response.statusText()}`);
      }

      this.log(sessionId, 'STEP_2_COMPLETE', '✅ Berhasil navigasi ke target URL');

      // 🆕 EXECUTE STEPS DENGAN TIMEOUT YANG LEBIH SINGKAT
      await this.executeQuickSteps(page, sessionId, config);

      this.log(sessionId, 'SESSION_COMPLETED', '✅ Semua steps completed successfully');

    } catch (error) {
      this.log(sessionId, 'EXECUTION_ERROR', `❌ Error dengan proxy ${proxyUrl}: ${error.message}`);
      throw error; // Lempar error untuk trigger proxy switch
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.log(sessionId, 'BROWSER_CLOSED', 'Browser closed');
        } catch (closeError) {
          this.log(sessionId, 'BROWSER_CLOSE_ERROR', `Error closing browser: ${closeError.message}`);
        }
      }
    }
  }

  // 🆕 METHOD: Steps yang lebih cepat
  async executeQuickSteps(page, sessionId, config) {
    const steps = [
      {
        name: 'STEP_3',
        action: async () => {
          this.log(sessionId, 'STEP_3', 'Quick scroll simulation...');
          await this.quickScroll(page);
        },
        timeout: 15000
      },
      {
        name: 'STEP_4', 
        action: async () => {
          this.log(sessionId, 'STEP_4', 'Looking for random link...');
          await this.clickRandomLink(page);
        },
        timeout: 10000
      },
      {
        name: 'STEP_5',
        action: async () => {
          this.log(sessionId, 'STEP_5', 'Final scroll...');
          await this.quickScroll(page);
        },
        timeout: 10000
      }
    ];

    for (const step of steps) {
      try {
        await Promise.race([
          step.action(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Step ${step.name} timeout`)), step.timeout)
          )
        ]);
        
        this.log(sessionId, `${step.name}_COMPLETE`, 'Step completed');
        
        await page.waitForTimeout(2000);
        
      } catch (stepError) {
        this.log(sessionId, `${step.name}_ERROR`, 
          `Step skipped: ${stepError.message}`);
      }
    }
  }

  async fallbackToBackupProxies(config, sessionId) {
    this.log(sessionId, 'PROXY_FALLBACK', 'Menggunakan backup proxies...');
    
    let backupList = this.proxyScraper.getBackupProxies();
    
    if (config.backupProxies && config.backupProxies.length > 0) {
      backupList = config.backupProxies;
    }
    
    this.log(sessionId, 'BACKUP_READY', `${backupList.length} backup proxies siap digunakan`);
    return backupList;
  }

  async launchBrowserWithProxy(config, proxyUrl, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Browser launch timeout setelah ${timeout}ms`));
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
      '--disable-web-security',
      '--window-size=1920,1080'
    ];

    // Tambahkan proxy server
    const browserProxy = this.formatProxyForBrowser(proxyUrl);
    args.push(`--proxy-server=${browserProxy}`);

    const launchOptions = {
      headless: "new",
      args: args,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000
    };

    return await puppeteer.launch(launchOptions);
  }

  async quickScroll(page) {
    try {
      await page.evaluate(() => {
        window.scrollTo(0, 500);
      });
      await page.waitForTimeout(2000);
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    } catch (error) {
      // Ignore scroll errors
    }
  }

  async clickRandomLink(page) {
    try {
      await page.evaluate(() => {
        const links = document.querySelectorAll('a[href]');
        if (links.length > 0) {
          const randomLink = links[Math.floor(Math.random() * links.length)];
          randomLink.click();
        }
      });
      await page.waitForTimeout(3000);
    } catch (error) {
      // Ignore click errors
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
        proxyCount: session.proxyList ? session.proxyList.length : 0,
        usedProxyCount: session.usedProxies ? session.usedProxies.length : 0
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
    return {
      mode: 'AUTO-SWITCH',
      message: 'Proxy akan di-switch otomatis jika timeout 60 detik',
      totalProxies: this.proxyHandler.getRemainingCount()
    };
  }
}

module.exports = TrafficGenerator;