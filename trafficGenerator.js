[file name]: trafficGenerator.js
[file content begin]
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
    
    // Extended User Agents Database 2025
    this.userAgents = {
      desktop: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.3124.85',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.10 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:136.0) Gecko/20100101 Firefox/136.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 OPR/118.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 OPR/118.0.0.0'
      ],
      mobile: [
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 15; SM-S931B Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.6533.103 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 14; SM-S928B/DS) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro Build/AD1A.240418.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.54 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 15; Pixel 8 Pro Build/AP4A.250105.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/132.0.6834.163 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.6998.99 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.6998.99 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/136.0 Mobile/15E148 Safari/605.1.15',
        'Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0',
        'Mozilla/5.0 (Android 15; Mobile; SM-G556B; rv:130.0) Gecko/130.0 Firefox/130.0',
        'Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36 EdgA/134.0.3124.68',
        'Mozilla/5.0 (iPad; CPU OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.7 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 14_7_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/136.0 Mobile/15E148 Safari/605.1.15'
      ]
    };

    // Pattern database untuk variasi session
    this.sessionPatterns = {
      FAST_READER: { 
        multiplier: 0.7, 
        description: "Pembaca cepat",
        scrollSpeed: "fast",
        readingTime: "short"
      },
      NORMAL_READER: { 
        multiplier: 1.0, 
        description: "Pembaca normal",
        scrollSpeed: "medium", 
        readingTime: "medium"
      },
      SLOW_READER: { 
        multiplier: 1.5, 
        description: "Pembaca lambat",
        scrollSpeed: "slow",
        readingTime: "long"
      },
      DETAILED_READER: { 
        multiplier: 2.0, 
        description: "Pembaca detail",
        scrollSpeed: "variable",
        readingTime: "very_long"
      }
    };

    // 🆕 DOMAIN IKLAN YANG HARUS DIIZINKAN
    this.adDomains = [
      'googleads',
      'doubleclick',
      'googlesyndication',
      'google-analytics',
      'adsystem',
      'amazon-adsystem',
      'facebook.com/tr',
      'fbcdn',
      'adnxs',
      'rubiconproject',
      'pubmatic',
      'openx',
      'criteo',
      'taboola',
      'outbrain',
      'revcontent',
      'adsco.re',
      'monetization',
      'adservice',
      'ads.',
      '.ad.',
      'adserver',
      'advertising',
      'affiliate',
      'tracking',
      'analytics'
    ];
  }

  // 🆕 METHOD: Cek apakah URL mengandung domain iklan
  isAdDomain(url) {
    return this.adDomains.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
  }

  // 🆕 METHOD: Setup request interception yang mengizinkan iklan
  setupAdFriendlyInterception(page, sessionId) {
    return new Promise((resolve) => {
      page.setRequestInterception(true);
      
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();
        
        // 🎯 IZINKAN SEMUA IKLAN DAN TRACKING
        if (this.isAdDomain(url)) {
          this.log(sessionId, 'AD_ALLOWED', `Mengizinkan iklan: ${resourceType} - ${url.substring(0, 80)}...`);
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN SEMUA GAMBAR (termasuk gambar iklan)
        if (resourceType === 'image') {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN SEMUA SCRIPT (termasuk script iklan)
        if (resourceType === 'script') {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN SEMUA MEDIA (video iklan, dll)
        if (resourceType === 'media') {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN FONT (agar iklan tampil dengan font yang benar)
        if (resourceType === 'font') {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN XHR/FETCH (untuk data iklan)
        if (resourceType === 'xhr' || resourceType === 'fetch') {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN DOCUMENT/MAIN FRAME
        if (resourceType === 'document') {
          req.continue();
          return;
        }
        
        // ❌ BLOKIR HANYA STYLESHEET untuk mempercepat loading (opsional)
        if (resourceType === 'stylesheet') {
          req.abort();
          return;
        }
        
        // ✅ IZINKAN SEMUA LAINNYA secara default
        req.continue();
      });

      // Tunggu sampai setup selesai
      setTimeout(resolve, 1000);
    });
  }

  // 🆕 METHOD: Click iklan Google secara otomatis
  async clickGoogleAds(page, sessionId) {
    try {
      this.log(sessionId, 'AD_CLICK_ATTEMPT', 'Mencari iklan Google untuk diklik...');
      
      // Tunggu beberapa detik untuk iklan dimuat
      await page.waitForTimeout(5000);
      
      const adClicked = await page.evaluate(() => {
        // Cari semua elemen yang kemungkinan adalah iklan Google
        const adSelectors = [
          'a[href*="googleadservices"]',
          'a[href*="doubleclick"]',
          'a[href*="googlesyndication"]',
          '.adsbygoogle',
          '[id*="ad"]',
          '[class*="ad"]',
          '[data-ad]',
          'ins.adsbygoogle',
          'iframe[src*="googleads"]',
          'iframe[src*="doubleclick"]'
        ];
        
        for (const selector of adSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            // Cek jika elemen terlihat di viewport
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && 
                rect.top >= 0 && rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)) {
              
              // Klik elemen iklan
              element.click();
              return true;
            }
          }
        }
        return false;
      });
      
      if (adClicked) {
        this.log(sessionId, 'AD_CLICK_SUCCESS', '✅ Berhasil mengklik iklan Google!');
        // Tunggu di halaman iklan untuk beberapa waktu
        await page.waitForTimeout(10000);
        return true;
      } else {
        this.log(sessionId, 'AD_CLICK_FAILED', '❌ Tidak menemukan iklan Google yang bisa diklik');
        return false;
      }
    } catch (error) {
      this.log(sessionId, 'AD_CLICK_ERROR', `Error mengklik iklan: ${error.message}`);
      return false;
    }
  }

  // 🆕 METHOD: Interaksi dengan konten iklan
  async interactWithAds(page, sessionId) {
    try {
      this.log(sessionId, 'AD_INTERACTION', 'Berinteraksi dengan konten iklan...');
      
      // Scroll melalui area yang mungkin berisi iklan
      await page.evaluate(() => {
        window.scrollTo(0, 300); // Scroll ke area iklan
      });
      
      await page.waitForTimeout(3000);
      
      // Hover di atas elemen iklan (simulasi interest)
      await page.evaluate(() => {
        const adElements = document.querySelectorAll('[class*="ad"], [id*="ad"], .adsbygoogle');
        if (adElements.length > 0) {
          const ad = adElements[0];
          const event = new MouseEvent('mouseover', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          ad.dispatchEvent(event);
        }
      });
      
      await page.waitForTimeout(2000);
      
      this.log(sessionId, 'AD_INTERACTION_SUCCESS', '✅ Interaksi iklan selesai');
      return true;
    } catch (error) {
      this.log(sessionId, 'AD_INTERACTION_ERROR', `Error interaksi iklan: ${error.message}`);
      return false;
    }
  }

  getRandomUserAgent(deviceType) {
    const agents = this.userAgents[deviceType] || this.userAgents.desktop;
    const selectedAgent = agents[Math.floor(Math.random() * agents.length)];
    return selectedAgent;
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

  async sessionDelay(sessionId, baseMinMs, baseMaxMs) {
    const pattern = this.getSessionPattern(sessionId);
    const minMs = baseMinMs * pattern.finalMultiplier;
    const maxMs = baseMaxMs * pattern.finalMultiplier;
    
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async readingPause(sessionId, contentComplexity = 'medium') {
    const pattern = this.getSessionPattern(sessionId);
    
    let baseMin, baseMax;
    switch(contentComplexity) {
      case 'simple': baseMin = 3000; baseMax = 8000; break;
      case 'complex': baseMin = 10000; baseMax = 25000; break;
      case 'medium': default: baseMin = 5000; baseMax = 15000;
    }
    
    const minMs = baseMin * pattern.finalMultiplier;
    const maxMs = baseMax * pattern.finalMultiplier;
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    
    this.log(sessionId, 'READING_PAUSE', `Berhenti membaca ${contentComplexity} content: ${Math.round(delay/1000)} detik [${pattern.patternType}]`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Menginisialisasi session baru...');
    
    let proxyList = [];
    
    if (config.proxySource === 'auto') {
      this.log(sessionId, 'PROXY_AUTO', 'Mengambil proxy gratis otomatis...');
      
      try {
        const proxyCount = config.proxyCount || 5;
        proxyList = await this.proxyScraper.getProxiesWithoutTest(proxyCount);
        
        if (proxyList.length > 0) {
          this.proxyHandler.addMultipleProxies(proxyList);
          this.log(sessionId, 'PROXY_AUTO_SUCCESS', `Berhasil mendapatkan ${proxyList.length} proxy`);
        } else {
          throw new Error('Tidak ada proxy yang berhasil diambil');
        }
      } catch (error) {
        this.log(sessionId, 'PROXY_AUTO_ERROR', `Gagal: ${error.message}`);
        throw error;
      }
    }
    else if (config.proxySource === 'manual' && config.proxyList && config.proxyList.length > 0) {
      this.log(sessionId, 'PROXY_MANUAL', `Memproses ${config.proxyList.length} proxy manual...`);
      
      const validProxies = config.proxyList.filter(proxy => proxy && proxy.trim() !== '');
      
      if (validProxies.length > 0) {
        this.proxyHandler.addMultipleProxies(validProxies);
        proxyList = validProxies;
        this.log(sessionId, 'PROXY_MANUAL_SUCCESS', `${validProxies.length} proxy manual ditambahkan`);
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

    this.log(sessionId, 'SESSION_STARTED', `Session dimulai dengan ${proxyList.length} proxy menargetkan: ${config.targetUrl}` + (config.isAutoLoop ? ' [AUTO-LOOP]' : ''));
    
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
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.executeSessionWithRetry(sessionId, config, retryCount + 1);
      } else {
        this.log(sessionId, 'SESSION_FAILED', `Session gagal setelah ${retryCount + 1} percobaan`);
        this.stopSession(sessionId);
      }
    }
  }

  async executeSession(sessionId, config) {
    let browser;
    let currentProxy = null;
    
    try {
      currentProxy = this.proxyHandler.getRandomProxy();
      if (!currentProxy) {
        throw new Error('Tidak ada proxy aktif');
      }

      this.log(sessionId, 'PROXY_SELECTED', `Menggunakan proxy: ${currentProxy.url}`);

      this.log(sessionId, 'STEP_1', 'Meluncurkan browser dengan proxy...');
      browser = await this.launchBrowserWithProxy(config, currentProxy.url, 60000);
      
      const page = await browser.newPage();
      
      page.setDefaultTimeout(45000);
      page.setDefaultNavigationTimeout(60000);

      // Set user agent
      const userAgent = this.getRandomUserAgent(config.deviceType);
      await page.setUserAgent(userAgent);
      
      const browserInfo = this.extractBrowserInfo(userAgent);
      this.log(sessionId, 'USER_AGENT_SET', `Menggunakan ${browserInfo}: ${userAgent.substring(0, 80)}...`);
      
      await page.setViewport({ 
        width: config.deviceType === 'mobile' ? 375 : 1280, 
        height: config.deviceType === 'mobile' ? 667 : 720 
      });

      // 🆕 SETUP INTERCEPTION YANG RAMAH IKLAN
      await this.setupAdFriendlyInterception(page, sessionId);

      this.log(sessionId, 'STEP_1_COMPLETE', 'Browser berhasil diluncurkan dengan support iklan');

      this.log(sessionId, 'STEP_2', `Navigasi ke: ${config.targetUrl}`);
      
      try {
        await page.goto(config.targetUrl, { 
          waitUntil: 'networkidle0', // Tunggu sampai semua resource selesai loading
          timeout: 60000
        });
        
        this.log(sessionId, 'STEP_2_COMPLETE', 'Berhasil navigasi ke target URL dengan iklan');

        await this.executeAllSteps(page, sessionId, config);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua langkah berhasil diselesaikan dengan iklan');

      } catch (navError) {
        this.log(sessionId, 'NAVIGATION_ERROR', `Navigasi gagal: ${navError.message}`);
        throw navError;
      }

    } catch (error) {
      this.log(sessionId, 'EXECUTION_ERROR', `Error selama eksekusi: ${error.message}`);
      if (currentProxy) {
        this.proxyHandler.removeFailedProxy(currentProxy.url);
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
      '--disable-features=SitePerProcess',
      '--disable-blink-features=AutomationControlled',
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

  formatProxyForBrowser(proxyUrl) {
    if (proxyUrl.includes('://')) {
      const urlParts = proxyUrl.split('://');
      return urlParts[1];
    }
    return proxyUrl;
  }

  async humanScroll(page, sessionId) {
    const pattern = this.getSessionPattern(sessionId);
    
    try {
      await page.evaluate(async (patternData) => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const scrollHeight = document.body.scrollHeight;
          const viewportHeight = window.innerHeight;
          const targetScroll = scrollHeight - viewportHeight;
          
          const scrollInterval = setInterval(() => {
            const baseSpeed = 80;
            let speedMultiplier = 1.0;
            
            if (patternData.patternType === 'FAST_READER') {
              speedMultiplier = 1.3 + (Math.random() * 0.4);
            } else if (patternData.patternType === 'SLOW_READER' || patternData.patternType === 'DETAILED_READER') {
              speedMultiplier = 0.6 + (Math.random() * 0.3);
            } else {
              speedMultiplier = 0.8 + (Math.random() * 0.4);
            }
            
            const scrollAmount = Math.floor(baseSpeed * speedMultiplier);
            window.scrollBy(0, scrollAmount);
            totalHeight += scrollAmount;
            
            const shouldPause = Math.random() < 0.15;
            if (shouldPause) {
              clearInterval(scrollInterval);
              const pauseTime = patternData.patternType === 'DETAILED_READER' ? 
                2000 + Math.random() * 4000 : 1000 + Math.random() * 2000;
              
              setTimeout(() => {
                const newInterval = setInterval(scrollStep, getScrollDelay());
              }, pauseTime);
            }
            
            if (totalHeight >= targetScroll) {
              clearInterval(scrollInterval);
              resolve();
            }
          }, getScrollDelay());

          function getScrollDelay() {
            let baseDelay;
            if (patternData.patternType === 'FAST_READER') {
              baseDelay = 80 + Math.random() * 120;
            } else if (patternData.patternType === 'SLOW_READER') {
              baseDelay = 200 + Math.random() * 300;
            } else if (patternData.patternType === 'DETAILED_READER') {
              baseDelay = 150 + Math.random() * 250;
            } else {
              baseDelay = 100 + Math.random() * 200;
            }
            return baseDelay;
          }

          function scrollStep() {
            const baseSpeed = 80;
            let speedMultiplier = 1.0;
            
            if (patternData.patternType === 'FAST_READER') {
              speedMultiplier = 1.3 + (Math.random() * 0.4);
            } else if (patternData.patternType === 'SLOW_READER' || patternData.patternType === 'DETAILED_READER') {
              speedMultiplier = 0.6 + (Math.random() * 0.3);
            } else {
              speedMultiplier = 0.8 + (Math.random() * 0.4);
            }
            
            const scrollAmount = Math.floor(baseSpeed * speedMultiplier);
            window.scrollBy(0, scrollAmount);
            totalHeight += scrollAmount;
            
            const shouldPause = Math.random() < 0.15;
            if (shouldPause) {
              clearInterval(scrollInterval);
              const pauseTime = patternData.patternType === 'DETAILED_READER' ? 
                2000 + Math.random() * 4000 : 1000 + Math.random() * 2000;
              
              setTimeout(() => {
                const newInterval = setInterval(scrollStep, getScrollDelay());
              }, pauseTime);
            }
            
            if (totalHeight >= targetScroll) {
              clearInterval(scrollInterval);
              resolve();
            }
          }
        });
      }, pattern);
    } catch (error) {
      console.log('Scroll error:', error.message);
    }
  }

  async analyzeContentComplexity(page) {
    try {
      const complexity = await page.evaluate(() => {
        const textContent = document.body.innerText || '';
        const wordCount = textContent.split(/\s+/).length;
        const imageCount = document.images.length;
        const paragraphCount = document.querySelectorAll('p').length;
        
        if (wordCount > 1000 || imageCount > 10) return 'complex';
        if (wordCount < 200 && imageCount < 3) return 'simple';
        return 'medium';
      });
      return complexity;
    } catch (error) {
      return 'medium';
    }
  }

  async executeAllSteps(page, sessionId, config) {
    const pattern = this.getSessionPattern(sessionId);
    this.log(sessionId, 'SESSION_PATTERN', `Pattern: ${pattern.description} (${pattern.patternType}) - Multiplier: ${pattern.finalMultiplier.toFixed(2)} - ${pattern.isEven ? 'GENAP' : 'GANJIL'}`);

    const contentComplexity = await this.analyzeContentComplexity(page);
    this.log(sessionId, 'CONTENT_ANALYSIS', `Kompleksitas konten: ${contentComplexity.toUpperCase()}`);

    const steps = [
      {
        name: 'INITIAL_READING',
        action: async () => {
          this.log(sessionId, 'INITIAL_READING', 'Membaca konten utama...');
          await this.readingPause(sessionId, contentComplexity);
        },
        timeout: 60000
      },
      {
        name: 'AD_INTERACTION_1',
        action: async () => {
          this.log(sessionId, 'AD_INTERACTION_1', 'Interaksi dengan iklan pertama...');
          await this.interactWithAds(page, sessionId);
        },
        timeout: 30000
      },
      {
        name: 'SCROLL_FIRST_PASS',
        action: async () => {
          this.log(sessionId, 'SCROLL_FIRST_PASS', 'Scroll pertama dengan pause membaca...');
          await this.humanScroll(page, sessionId);
        },
        timeout: 120000
      },
      {
        name: 'AD_CLICK_ATTEMPT',
        action: async () => {
          this.log(sessionId, 'AD_CLICK_ATTEMPT', 'Mencoba klik iklan Google...');
          await this.clickGoogleAds(page, sessionId);
        },
        timeout: 30000
      },
      {
        name: 'DEEP_READING_PAUSE',
        action: async () => {
          this.log(sessionId, 'DEEP_READING_PAUSE', 'Pause membaca mendalam...');
          const pauseMultiplier = pattern.patternType === 'DETAILED_READER' ? 1.5 : 1.0;
          await this.sessionDelay(sessionId, 8000 * pauseMultiplier, 20000 * pauseMultiplier);
        },
        timeout: 30000
      },
      {
        name: 'AD_INTERACTION_2',
        action: async () => {
          this.log(sessionId, 'AD_INTERACTION_2', 'Interaksi dengan iklan kedua...');
          await this.interactWithAds(page, sessionId);
        },
        timeout: 30000
      },
      {
        name: 'CLICK_RANDOM_LINK',
        action: async () => {
          this.log(sessionId, 'CLICK_RANDOM_LINK', 'Mencari link untuk diklik...');
          await this.sessionDelay(sessionId, 2000, 5000);
          const clicked = await this.clickRandomLink(page, sessionId);
          if (!clicked) {
            this.log(sessionId, 'NO_LINKS_FOUND', 'Tidak menemukan link yang sesuai');
          }
        },
        timeout: 30000
      },
      {
        name: 'POST_CLICK_READING',
        action: async () => {
          if (await this.clickRandomLink(page, sessionId)) {
            this.log(sessionId, 'POST_CLICK_READING', 'Membaca halaman baru setelah klik...');
            const newComplexity = await this.analyzeContentComplexity(page);
            await this.readingPause(sessionId, newComplexity);
          }
        },
        timeout: 60000
      },
      {
        name: 'SCROLL_NEW_PAGE',
        action: async () => {
          this.log(sessionId, 'SCROLL_NEW_PAGE', 'Scroll halaman baru...');
          await this.humanScroll(page, sessionId);
        },
        timeout: 120000
      },
      {
        name: 'FINAL_AD_INTERACTION',
        action: async () => {
          this.log(sessionId, 'FINAL_AD_INTERACTION', 'Interaksi iklan terakhir...');
          await this.interactWithAds(page, sessionId);
        },
        timeout: 30000
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
        this.log(sessionId, `${step.name}_COMPLETE`, `Step selesai (${Math.round(stepDuration/1000)} detik)`);
        
        if (index < steps.length - 1) {
          await this.sessionDelay(sessionId, 3000, 10000);
        }
        
      } catch (stepError) {
        this.log(sessionId, `${step.name}_ERROR`, `Step gagal: ${stepError.message}`);
      }
    }
  }

  async clickRandomLink(page, sessionId) {
    try {
      const links = await page.$$eval('a[href]', anchors => 
        anchors
          .filter(a => {
            const href = a.href;
            const text = a.textContent.trim();
            return href && 
                   !href.includes('#') && 
                   !href.startsWith('javascript:') &&
                   href !== window.location.href &&
                   text.length > 3 &&
                   !a.closest('header') &&
                   !a.closest('footer') &&
                   !a.closest('nav');
          })
          .map(a => ({
            href: a.href,
            text: a.textContent.trim().substring(0, 50),
            area: a.getBoundingClientRect()
          }))
      );
      
      if (links.length > 0) {
        const pattern = this.getSessionPattern(sessionId);
        let selectedLink;
        
        if (pattern.patternType === 'DETAILED_READER') {
          selectedLink = links.reduce((longest, current) => 
            current.text.length > longest.text.length ? current : longest
          );
        } else if (pattern.patternType === 'FAST_READER') {
          selectedLink = links.find(link => link.area.width > 0 && link.area.height > 0) || links[0];
        } else {
          selectedLink = links[Math.floor(Math.random() * links.length)];
        }
        
        this.log(sessionId, 'SELECTED_LINK', `Memilih link: "${selectedLink.text}" [${pattern.patternType}]`);
        
        await page.goto(selectedLink.href, { 
          waitUntil: 'networkidle0', // Tunggu semua resource termasuk iklan
          timeout: 30000 
        });
        return true;
      }
      return false;
    } catch (error) {
      this.log(sessionId, 'CLICK_ERROR', `Error klik link: ${error.message}`);
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
    } else if (step.includes('AD_')) {
      console.log('💰', logMessage);
    } else if (step.includes('USER_AGENT')) {
      console.log('🌐', logMessage);
    } else if (step.includes('PROXY')) {
      console.log('🔌', logMessage);
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

  setAutoRestart(enabled) {
    this.autoRestartEnabled = enabled;
    console.log(`🔄 Auto-restart ${enabled ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`);
  }

  getProxyStatus() {
    return {
      totalActive: this.proxyHandler.getRemainingCount(),
      totalFailed: 0,
      message: '🔧 MODE TANPA TEST: Proxy akan di-test saat runtime'
    };
  }
}

module.exports = TrafficGenerator;
[file content end]