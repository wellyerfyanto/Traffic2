const puppeteer = require('puppeteer-extra'); // ✅ KEMBALI KE PUPPETEER-EXTRA
const StealthPlugin = require('puppeteer-extra-plugin-stealth'); // ✅ TAMBAH STEALTH PLUGIN
const ProxyHandler = require('./proxyHandler.js');
const ProxyScraper = require('./proxyScraper.js');

// ✅ AKTIFKAN STEALTH PLUGIN
puppeteer.use(StealthPlugin());

class TrafficGenerator {
  constructor() {
    this.activeSessions = new Map();
    this.sessionLogs = new Map();
    this.proxyHandler = new ProxyHandler();
    this.proxyScraper = new ProxyScraper();
    this.autoRestartEnabled = true;
    
    // ✅ OPTIMIZED CONFIGURATION
    this.iterationConfig = {
      minIterations: 2,
      maxIterations: 4,
      adPageMultiplier: 1.7,
      baseInteractionTime: 1.3
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

    // 🎯 BEHAVIOR PATTERNS
    this.sessionPatterns = {
      FAST_READER: { 
        multiplier: 0.8,
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
        multiplier: 1.3,
        description: "Pembaca lambat",
        scrollSpeed: "slow",
        readingTime: "long"
      },
      DETAILED_READER: { 
        multiplier: 1.6,
        description: "Pembaca detail",
        scrollSpeed: "variable",
        readingTime: "very_long"
      }
    };

    // 🎯 AD DOMAINS WHITELIST
    this.adDomains = [
      'googleads', 'doubleclick', 'googlesyndication', 'google-analytics',
      'adsystem', 'amazon-adsystem', 'facebook.com/tr', 'fbcdn',
      'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'criteo',
      'taboola', 'outbrain', 'revcontent', 'adsco.re', 'monetization'
    ];
  }

  // 🎯 MAIN BROWSER LAUNCH - DENGAN STEALTH PLUGIN
  async launchBrowser(config, proxyUrl) {
    console.log('🚀 Launching browser dengan Puppeteer Extra + Stealth Plugin...');
    
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
      '--disable-renderer-backgrounding',
      '--disable-back-forward-cache',
      '--disable-domain-reliability'
    ];

    const launchOptions = {
      headless: "new",
      args: args,
      ignoreHTTPSErrors: true,
      timeout: 60000
    };

    // ✅ Gunakan environment Chromium jika tersedia (for Railway)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log('🔧 Using system Chromium:', process.env.PUPPETEER_EXECUTABLE_PATH);
    }

    try {
      const browser = await puppeteer.launch(launchOptions);
      console.log('✅ Browser launched successfully dengan Puppeteer Extra + Stealth');
      return browser;
    } catch (error) {
      console.error('❌ Browser launch failed:', error.message);
      throw error;
    }
  }

  // 🎯 ADVANCED STEALTH SETUP
  async setupAdvancedStealth(page, sessionId) {
    try {
      // Additional stealth evasions
      await page.evaluateOnNewDocument(() => {
        // Override the permissions property
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );

        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Override languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Mock Chrome runtime
        window.chrome = {
          runtime: {},
        };
      });

      // Set extra HTTP headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      });

      this.log(sessionId, 'STEALTH_SETUP', '✅ Advanced stealth techniques applied');
    } catch (error) {
      this.log(sessionId, 'STEALTH_ERROR', `Stealth setup error: ${error.message}`);
    }
  }

  // 🎯 ADVANCED AD DETECTION
  async detectAdPage(page, sessionId) {
    try {
      const adData = await page.evaluate(() => {
        const adSelectors = [
          '.adsbygoogle', 'ins.adsbygoogle', 
          'iframe[src*="googleads"]', 'iframe[src*="doubleclick"]',
          '[id*="ad-container"]', '.ad-unit', '.ad-container',
          'div[id*="google_ads"]', '[data-google-query-id]',
          'a[href*="googleadservices.com"]', '.advertisement',
          '[data-ad-status]', '.ad-slot', '[data-ad-client]'
        ];
        
        let detectedAds = [];
        let totalAds = 0;
        let visibleAds = 0;
        
        for (const selector of adSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            totalAds += elements.length;
            
            for (const element of elements) {
              const rect = element.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0 && 
                               rect.top < window.innerHeight && 
                               rect.bottom > 0;
              
              if (isVisible) {
                visibleAds++;
                detectedAds.push({
                  selector: selector,
                  position: { top: rect.top, left: rect.left },
                  size: { width: rect.width, height: rect.height }
                });
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        return { totalAds, visibleAds, detectedAds };
      });
      
      if (adData.visibleAds > 0) {
        this.log(sessionId, 'AD_PAGE_DETECTED', 
          `🚨 Halaman mengandung ${adData.visibleAds} iklan visible dari ${adData.totalAds} total - AKTIFKAN PERLAMBATAN`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.log(sessionId, 'AD_DETECTION_ERROR', `Error deteksi iklan: ${error.message}`);
      return false;
    }
  }

  // 🎯 COMPREHENSIVE AD INTERACTION
  async comprehensiveAdInteraction(page, sessionId, multiplier = 1.0) {
    try {
      this.log(sessionId, 'COMPREHENSIVE_AD_INTERACTION', 'Memulai interaksi iklan komprehensif...');
      
      let interactionCount = 0;
      
      // Scroll melalui berbagai posisi yang mungkin ada iklan
      const scrollPositions = [200, 500, 800, 1200, 1600];
      
      for (const position of scrollPositions) {
        await page.evaluate((pos) => {
          window.scrollTo(0, pos);
        }, position);
        
        await page.waitForTimeout(1500 * multiplier);
        
        // Hover di atas elemen iklan
        const hovered = await page.evaluate(() => {
          const adElements = document.querySelectorAll('.adsbygoogle, ins.adsbygoogle, [id*="ad"]');
          for (const element of adElements) {
            try {
              const rect = element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && 
                  rect.top >= 0 && rect.top < window.innerHeight) {
                
                const event = new MouseEvent('mouseover', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                });
                element.dispatchEvent(event);
                return true;
              }
            } catch (e) {
              continue;
            }
          }
          return false;
        });
        
        if (hovered) interactionCount++;
        await page.waitForTimeout(2000 * multiplier);
      }
      
      this.log(sessionId, 'COMPREHENSIVE_AD_SUCCESS', 
        `✅ Interaksi iklan komprehensif selesai (${interactionCount} interaksi)`);
      return true;
    } catch (error) {
      this.log(sessionId, 'COMPREHENSIVE_AD_ERROR', `Error interaksi komprehensif: ${error.message}`);
      return false;
    }
  }

  // 🎯 ADVANCED GOOGLE ADS CLICK
  async clickGoogleAds(page, sessionId) {
    try {
      this.log(sessionId, 'AD_CLICK_ATTEMPT', 'Mencari iklan Google untuk diklik...');
      
      await page.waitForTimeout(3000);
      
      // Strategy 1: Direct element click
      const adClicked = await page.evaluate(() => {
        const adSelectors = [
          'a[href*="googleadservices.com"]',
          'a[href*="doubleclick.net"]',
          '.adsbygoogle',
          'ins.adsbygoogle',
          'div[id*="google_ads"]',
          '[data-google-query-id]',
          'iframe[src*="googleads"]'
        ];
        
        for (const selector of adSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              const rect = element.getBoundingClientRect();
              if (rect.width > 10 && rect.height > 10 && 
                  rect.top >= 0 && rect.left >= 0 &&
                  rect.bottom <= window.innerHeight && 
                  rect.right <= window.innerWidth) {
                
                // Scroll ke element
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Simulate human-like click dengan event sequence
                const mouseDown = new MouseEvent('mousedown', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                });
                
                const mouseUp = new MouseEvent('mouseup', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                });
                
                const clickEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                });
                
                element.dispatchEvent(mouseDown);
                element.dispatchEvent(mouseUp);
                element.dispatchEvent(clickEvent);
                
                return true;
              }
            }
          } catch (e) {
            continue;
          }
        }
        return false;
      });
      
      if (adClicked) {
        this.log(sessionId, 'AD_CLICK_SUCCESS', '✅ Berhasil mengklik iklan Google!');
        await page.waitForTimeout(8000); // Tunggu di halaman iklan
        return true;
      }
      
      // Strategy 2: Click melalui iframe
      const frames = page.frames();
      for (const frame of frames) {
        try {
          const frameUrl = frame.url();
          if (frameUrl.includes('googleads') || frameUrl.includes('doubleclick')) {
            this.log(sessionId, 'AD_IFRAME_FOUND', `Found ad iframe: ${frameUrl.substring(0, 80)}...`);
            
            const adInFrame = await frame.evaluate(() => {
              const clickableElements = document.querySelectorAll('a, button, [onclick]');
              for (const element of clickableElements) {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  element.click();
                  return true;
                }
              }
              return false;
            });
            
            if (adInFrame) {
              this.log(sessionId, 'AD_IFRAME_CLICK_SUCCESS', '✅ Clicked ad inside iframe!');
              await page.waitForTimeout(8000);
              return true;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      this.log(sessionId, 'AD_CLICK_FAILED', '❌ Tidak menemukan iklan Google yang bisa diklik');
      return false;
      
    } catch (error) {
      this.log(sessionId, 'AD_CLICK_ERROR', `Error mengklik iklan: ${error.message}`);
      return false;
    }
  }

  // 🎯 HUMAN-LIKE SCROLLING
  async humanScroll(page, sessionId, multiplier = 1.0) {
    const pattern = this.getSessionPattern(sessionId);
    
    try {
      await page.evaluate(async (patternData, speedMultiplier) => {
        await new Promise((resolve) => {
          const totalHeight = document.body.scrollHeight;
          const viewportHeight = window.innerHeight;
          const scrollableHeight = totalHeight - viewportHeight;
          const targetScroll = Math.min(scrollableHeight * 0.8, 5000);
          
          let currentScroll = 0;
          let scrollDirection = 1;
          let scrollCount = 0;
          let consecutiveDirectionChanges = 0;
          
          const getScrollSpeed = () => {
            let baseSpeed = 50;
            if (patternData.patternType === 'FAST_READER') baseSpeed = 70;
            if (patternData.patternType === 'SLOW_READER') baseSpeed = 30;
            if (patternData.patternType === 'DETAILED_READER') baseSpeed = 40;
            
            return baseSpeed * speedMultiplier * (0.7 + Math.random() * 0.6);
          };
          
          const getScrollDelay = () => {
            let baseDelay = 80;
            if (patternData.patternType === 'FAST_READER') baseDelay = 50;
            if (patternData.patternType === 'SLOW_READER') baseDelay = 120;
            if (patternData.patternType === 'DETAILED_READER') baseDelay = 100;
            return baseDelay * speedMultiplier;
          };
          
          const shouldPause = () => {
            // Random pauses based on pattern
            const pauseChance = patternData.patternType === 'DETAILED_READER' ? 0.2 : 0.1;
            return Math.random() < pauseChance;
          };
          
          const shouldChangeDirection = () => {
            // Occasionally change direction to mimic human behavior
            const changeChance = patternData.patternType === 'DETAILED_READER' ? 0.15 : 0.08;
            return Math.random() < changeChance && consecutiveDirectionChanges < 3;
          };
          
          const scrollStep = () => {
            scrollCount++;
            
            const speed = getScrollSpeed();
            currentScroll += speed * scrollDirection;
            
            // Boundary checks and direction changes
            if (currentScroll >= targetScroll || currentScroll <= 0 || shouldChangeDirection()) {
              scrollDirection *= -1;
              consecutiveDirectionChanges++;
            } else {
              consecutiveDirectionChanges = 0;
            }
            
            // Ensure within bounds
            currentScroll = Math.max(0, Math.min(targetScroll, currentScroll));
            
            window.scrollTo(0, currentScroll);
            
            // Random pauses
            if (shouldPause()) {
              clearInterval(scrollInterval);
              const pauseTime = patternData.patternType === 'DETAILED_READER' ? 
                1000 + Math.random() * 3000 : 500 + Math.random() * 1500;
              
              setTimeout(() => {
                scrollInterval = setInterval(scrollStep, getScrollDelay());
              }, pauseTime);
            }
            
            // Completion conditions
            if (scrollCount > 100 || (currentScroll >= targetScroll && scrollDirection === 1)) {
              clearInterval(scrollInterval);
              resolve();
            }
          };
          
          let scrollInterval = setInterval(scrollStep, getScrollDelay());
        });
      }, pattern, multiplier);
      
      this.log(sessionId, 'SCROLL_COMPLETE', 'Scroll manusiawi selesai');
    } catch (error) {
      this.log(sessionId, 'SCROLL_ERROR', `Error scroll: ${error.message}`);
    }
  }

  // 🎯 SMART REQUEST INTERCEPTION
  async setupAdFriendlyInterception(page, sessionId) {
    return new Promise((resolve) => {
      page.setRequestInterception(true);
      
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();
        
        // 🎯 IZINKAN SEMUA IKLAN DAN TRACKING
        if (this.isAdDomain(url)) {
          this.log(sessionId, 'AD_ALLOWED', `Mengizinkan: ${resourceType} - ${url.substring(0, 60)}...`);
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN RESOURCES PENTING
        if (['document', 'script', 'xhr', 'fetch'].includes(resourceType)) {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN GAMBAR (untuk visual ads)
        if (resourceType === 'image') {
          req.continue();
          return;
        }
        
        // 🎯 IZINKAN FONT & MEDIA
        if (['font', 'media'].includes(resourceType)) {
          req.continue();
          return;
        }
        
        // ❌ BLOKIR STYLESHEET untuk mempercepat loading
        if (resourceType === 'stylesheet') {
          req.abort();
          return;
        }
        
        // ✅ IZINKAN LAINNYA secara default
        req.continue();
      });

      setTimeout(resolve, 1000);
    });
  }

  // 🎯 CONTENT ANALYSIS
  async analyzeContentComplexity(page) {
    try {
      const complexity = await page.evaluate(() => {
        const textContent = document.body.innerText || '';
        const wordCount = textContent.split(/\s+/).length;
        const imageCount = document.images.length;
        const paragraphCount = document.querySelectorAll('p').length;
        const videoCount = document.querySelectorAll('video').length;
        
        let score = 0;
        if (wordCount > 1000) score += 3;
        else if (wordCount > 500) score += 2;
        else if (wordCount > 200) score += 1;
        
        if (imageCount > 10) score += 2;
        else if (imageCount > 5) score += 1;
        
        if (paragraphCount > 15) score += 1;
        if (videoCount > 0) score += 1;
        
        if (score >= 5) return 'complex';
        if (score >= 3) return 'medium';
        return 'simple';
      });
      return complexity;
    } catch (error) {
      return 'medium';
    }
  }

  // 🎯 MAIN SESSION EXECUTION
  async executeAllSteps(page, sessionId, config) {
    const pattern = this.getSessionPattern(sessionId);
    this.log(sessionId, 'SESSION_PATTERN', 
      `Pattern: ${pattern.description} (${pattern.patternType}) - Multiplier: ${pattern.finalMultiplier.toFixed(2)}`);

    const iterationCount = Math.floor(Math.random() * 
      (this.iterationConfig.maxIterations - this.iterationConfig.minIterations + 1)) + 
      this.iterationConfig.minIterations;
    
    this.log(sessionId, 'ITERATION_SETUP', `Akan melakukan ${iterationCount} iterasi kunjungan halaman`);

    let currentUrl = config.targetUrl;
    let totalAdInteractions = 0;
    
    for (let iteration = 1; iteration <= iterationCount; iteration++) {
      this.log(sessionId, `ITERATION_${iteration}_START`, `🎯 Memulai iterasi ${iteration}/${iterationCount}`);
      
      if (iteration > 1) {
        this.log(sessionId, 'NAVIGATION', `Mengunjungi: ${currentUrl}`);
        try {
          await page.goto(currentUrl, { 
            waitUntil: 'networkidle0',
            timeout: 45000
          });
          this.log(sessionId, 'NAVIGATION_SUCCESS', 'Berhasil navigasi ke halaman');
        } catch (navError) {
          this.log(sessionId, 'NAVIGATION_ERROR', `Navigasi gagal: ${navError.message}`);
          continue;
        }
      }

      const isAdPage = await this.detectAdPage(page, sessionId);
      const timeMultiplier = isAdPage ? this.iterationConfig.adPageMultiplier : 1.0;
      const interactionMultiplier = timeMultiplier * this.iterationConfig.baseInteractionTime;
      
      if (isAdPage) {
        this.log(sessionId, 'SLOW_MODE', `⏳ AKTIFKAN MODE PERLAMBATAN: ${interactionMultiplier.toFixed(1)}x`);
      }

      const contentComplexity = await this.analyzeContentComplexity(page);
      this.log(sessionId, 'CONTENT_ANALYSIS', 
        `Kompleksitas: ${contentComplexity.toUpperCase()} ${isAdPage ? '🚨 +ADS' : ''}`);

      // 🎯 COMPLETE STEP SEQUENCE
      const extendedSteps = [
        {
          name: 'EXTENDED_INITIAL_READING',
          action: async () => {
            this.log(sessionId, 'EXTENDED_READING', `Membaca konten utama ${isAdPage ? 'DENGAN IKLAN' : ''}...`);
            await this.extendedReadingPause(sessionId, contentComplexity, interactionMultiplier);
          },
          timeout: 60000
        },
        {
          name: 'DEEP_AD_INTERACTION',
          action: async () => {
            this.log(sessionId, 'DEEP_AD_INTERACTION', 'Interaksi mendalam dengan iklan...');
            const result = await this.comprehensiveAdInteraction(page, sessionId, interactionMultiplier);
            if (result) totalAdInteractions++;
          },
          timeout: 45000
        },
        {
          name: 'SLOW_SCROLL_FIRST_PASS',
          action: async () => {
            this.log(sessionId, 'SLOW_SCROLL', `Scroll perlahan ${isAdPage ? 'DENGAN PERHATIAN EKSTRA KE IKLAN' : ''}...`);
            await this.humanScroll(page, sessionId, interactionMultiplier);
          },
          timeout: 120000
        },
        {
          name: 'STRATEGIC_AD_CLICK',
          action: async () => {
            this.log(sessionId, 'STRATEGIC_AD_CLICK', 'Mencoba klik iklan dengan strategi...');
            const clicked = await this.clickGoogleAds(page, sessionId);
            if (clicked) totalAdInteractions++;
          },
          timeout: 60000
        },
        {
          name: 'EXTENDED_DEEP_READING',
          action: async () => {
            this.log(sessionId, 'EXTENDED_DEEP_READING', 'Pause membaca mendalam...');
            const pauseMultiplier = pattern.patternType === 'DETAILED_READER' ? 1.8 : 1.2;
            const extendedMultiplier = pauseMultiplier * interactionMultiplier;
            await this.sessionDelay(sessionId, 10000 * extendedMultiplier, 25000 * extendedMultiplier);
          },
          timeout: 40000
        },
        {
          name: 'COMPREHENSIVE_AD_INTERACTION',
          action: async () => {
            this.log(sessionId, 'COMPREHENSIVE_AD_INTERACTION', 'Interaksi komprehensif dengan semua iklan...');
            const result = await this.comprehensiveAdInteraction(page, sessionId, interactionMultiplier);
            if (result) totalAdInteractions++;
          },
          timeout: 45000
        },
        {
          name: 'FINAL_SCROLL_REVIEW',
          action: async () => {
            this.log(sessionId, 'FINAL_SCROLL_REVIEW', 'Scroll review akhir...');
            await page.evaluate(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            await page.waitForTimeout(3000 * interactionMultiplier);
          },
          timeout: 20000
        }
      ];

      for (const [index, step] of extendedSteps.entries()) {
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
          if (index < extendedSteps.length - 1) {
            await this.sessionDelay(sessionId, 3000 * interactionMultiplier, 10000 * interactionMultiplier);
          }
          
        } catch (stepError) {
          this.log(sessionId, `${step.name}_ERROR`, `Step gagal: ${stepError.message}`);
        }
      }

      // Cari halaman berikutnya untuk iterasi selanjutnya
      if (iteration < iterationCount) {
        const nextUrl = await this.findNextPageUrl(page, sessionId, currentUrl);
        if (nextUrl && nextUrl !== currentUrl) {
          currentUrl = nextUrl;
          this.log(sessionId, 'NEXT_PAGE_SELECTED', `Halaman berikutnya: ${nextUrl.substring(0, 80)}...`);
        } else {
          // Fallback: tambah parameter untuk variasi
          currentUrl = config.targetUrl + (config.targetUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          this.log(sessionId, 'REUSE_CURRENT_PAGE', 'Menggunakan URL dengan timestamp untuk iterasi berikutnya');
        }
        
        // Jeda antar iterasi
        await this.sessionDelay(sessionId, 8000 * interactionMultiplier, 20000 * interactionMultiplier);
      }

      this.log(sessionId, `ITERATION_${iteration}_COMPLETE`, 
        `✅ Iterasi ${iteration} selesai dengan ${totalAdInteractions} interaksi iklan`);
    }

    // Final ad engagement
    await this.finalAdEngagement(page, sessionId);
    
    this.log(sessionId, 'ALL_ITERATIONS_COMPLETED', 
      `🎉 Semua ${iterationCount} iterasi selesai dengan total ${totalAdInteractions} interaksi iklan!`);
  }

  // 🎯 FINAL AD ENGAGEMENT
  async finalAdEngagement(page, sessionId) {
    try {
      this.log(sessionId, 'FINAL_AD_ENGAGEMENT', 'Interaksi iklan terakhir sebelum session berakhir...');
      
      // Scroll akhir melalui semua area
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(3000);
      
      // Final hover pada semua elemen iklan
      await page.evaluate(() => {
        try {
          const adElements = document.querySelectorAll('.adsbygoogle, ins.adsbygoogle, [id*="ad"]');
          adElements.forEach((ad, index) => {
            if (index < 5) { // Batasi jumlah interaksi
              const rect = ad.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                const event = new MouseEvent('mouseover', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                });
                ad.dispatchEvent(event);
              }
            }
          });
        } catch (e) {
          // Ignore errors
        }
      });
      
      this.log(sessionId, 'FINAL_AD_SUCCESS', '✅ Interaksi iklan final selesai');
    } catch (error) {
      this.log(sessionId, 'FINAL_AD_ERROR', `Error interaksi final: ${error.message}`);
    }
  }

  // 🎯 EXTENDED READING PAUSE
  async extendedReadingPause(sessionId, contentComplexity, multiplier = 1.0) {
    const pattern = this.getSessionPattern(sessionId);
    
    let baseMin, baseMax;
    switch(contentComplexity) {
      case 'simple': baseMin = 4000; baseMax = 10000; break;
      case 'complex': baseMin = 12000; baseMax = 30000; break;
      case 'medium': default: baseMin = 6000; baseMax = 20000; break;
    }
    
    const minMs = baseMin * pattern.finalMultiplier * multiplier;
    const maxMs = baseMax * pattern.finalMultiplier * multiplier;
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    
    this.log(sessionId, 'EXTENDED_READING_PAUSE', 
      `Membaca diperpanjang: ${Math.round(delay/1000)} detik [${multiplier.toFixed(1)}x multiplier]`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // 🎯 FIND NEXT PAGE URL
  async findNextPageUrl(page, sessionId, currentUrl) {
    try {
      const links = await page.$$eval('a[href]', (anchors, currentUrl) => 
        anchors
          .filter(a => {
            try {
              const href = a.href;
              const text = a.textContent.trim();
              return href && 
                     !href.includes('#') && 
                     !href.startsWith('javascript:') &&
                     !href.includes('mailto:') &&
                     !href.includes('tel:') &&
                     href !== currentUrl &&
                     text.length > 3 &&
                     !a.closest('header') &&
                     !a.closest('footer') &&
                     !a.closest('nav') &&
                     new URL(href).hostname === new URL(currentUrl).hostname;
            } catch (e) {
              return false;
            }
          })
          .map(a => ({
            href: a.href,
            text: a.textContent.trim().substring(0, 50),
            area: a.getBoundingClientRect()
          }))
      , currentUrl);
      
      if (links.length > 0) {
        // Prioritaskan link yang visible dan besar
        const visibleLinks = links.filter(link => 
          link.area.width > 0 && link.area.height > 0
        );
        
        const selectedLinks = visibleLinks.length > 0 ? visibleLinks : links;
        const randomLink = selectedLinks[Math.floor(Math.random() * selectedLinks.length)];
        return randomLink.href;
      }
      return null;
    } catch (error) {
      this.log(sessionId, 'FIND_NEXT_URL_ERROR', `Error mencari URL berikutnya: ${error.message}`);
      return null;
    }
  }

  // 🎯 SESSION MANAGEMENT
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
        // Fallback ke backup proxies
        proxyList = this.proxyScraper.getBackupProxies();
        this.proxyHandler.addMultipleProxies(proxyList);
        this.log(sessionId, 'PROXY_BACKUP_USED', `Menggunakan ${proxyList.length} backup proxy`);
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

    this.log(sessionId, 'SESSION_STARTED', 
      `Session dimulai dengan ${proxyList.length} proxy menargetkan: ${config.targetUrl}` + 
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

      this.log(sessionId, 'STEP_1', 'Meluncurkan browser dengan proxy + stealth...');
      browser = await this.launchBrowserWithProxy(config, currentProxy.url, 60000);
      
      const page = await browser.newPage();
      
      // Set timeouts
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(45000);

      // Set user agent
      const userAgent = this.getRandomUserAgent(config.deviceType);
      await page.setUserAgent(userAgent);
      
      const browserInfo = this.extractBrowserInfo(userAgent);
      this.log(sessionId, 'USER_AGENT_SET', `Menggunakan ${browserInfo}: ${userAgent.substring(0, 80)}...`);
      
      await page.setViewport({ 
        width: config.deviceType === 'mobile' ? 375 : 1280, 
        height: config.deviceType === 'mobile' ? 667 : 720 
      });

      // Setup advanced stealth techniques
      await this.setupAdvancedStealth(page, sessionId);

      // Setup interception
      await this.setupAdFriendlyInterception(page, sessionId);

      this.log(sessionId, 'STEP_1_COMPLETE', 'Browser berhasil diluncurkan dengan stealth + proxy');

      this.log(sessionId, 'STEP_2', `Navigasi ke: ${config.targetUrl}`);
      
      try {
        await page.goto(config.targetUrl, { 
          waitUntil: 'networkidle0',
          timeout: 45000
        });
        
        this.log(sessionId, 'STEP_2_COMPLETE', 'Berhasil navigasi ke target URL dengan stealth');

        await this.executeAllSteps(page, sessionId, config);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua langkah berhasil diselesaikan dengan stealth');

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

  // 🎯 UTILITY METHODS
  async launchBrowserWithProxy(config, proxyUrl, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Browser launch timeout after ${timeout}ms`));
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

  async sessionDelay(sessionId, minMs, maxMs) {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async readingPause(sessionId, contentComplexity = 'medium') {
    const pattern = this.getSessionPattern(sessionId);
    
    let baseMin, baseMax;
    switch(contentComplexity) {
      case 'simple': baseMin = 2000; baseMax = 6000; break;
      case 'complex': baseMin = 8000; baseMax = 20000; break;
      case 'medium': default: baseMin = 4000; baseMax = 12000; break;
    }
    
    const minMs = baseMin * pattern.finalMultiplier;
    const maxMs = baseMax * pattern.finalMultiplier;
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    
    this.log(sessionId, 'READING_PAUSE', `Berhenti membaca ${contentComplexity} content: ${Math.round(delay/1000)} detik [${pattern.patternType}]`);
    return new Promise(resolve => setTimeout(resolve, delay));
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
    } else if (step.includes('AD_')) {
      console.log('💰', logMessage);
    } else if (step.includes('USER_AGENT')) {
      console.log('🌐', logMessage);
    } else if (step.includes('PROXY')) {
      console.log('🔌', logMessage);
    } else if (step.includes('ITERATION')) {
      console.log('🎯', logMessage);
    } else if (step.includes('SLOW_MODE')) {
      console.log('⏳', logMessage);
    } else if (step.includes('STEALTH')) {
      console.log('🕵️', logMessage);
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
      message: '🔧 Proxy system ready'
    };
  }
}

module.exports = TrafficGenerator;