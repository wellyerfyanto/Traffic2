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
    
    // ✅ OPTIMIZED CONFIGURATION UNTUK VIEWABLE ADS
    this.iterationConfig = {
      minIterations: 2,
      maxIterations: 4,
      adPageMultiplier: 1.7,
      baseInteractionTime: 1.3,
      viewableMinTime: 3000, // Minimal 3 detik untuk viewable
      scrollDwellTime: 2500  // Waktu tunggu setelah scroll
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

    // 🎯 BEHAVIOR PATTERNS OPTIMIZED UNTUK VIEWABLE
    this.sessionPatterns = {
      FAST_READER: { 
        multiplier: 0.8,
        description: "Pembaca cepat",
        scrollSpeed: "fast",
        readingTime: "short",
        viewableFocus: "medium"
      },
      NORMAL_READER: { 
        multiplier: 1.0, 
        description: "Pembaca normal",
        scrollSpeed: "medium", 
        readingTime: "medium",
        viewableFocus: "high"
      },
      SLOW_READER: { 
        multiplier: 1.3,
        description: "Pembaca lambat",
        scrollSpeed: "slow",
        readingTime: "long",
        viewableFocus: "very_high"
      },
      DETAILED_READER: { 
        multiplier: 1.6,
        description: "Pembaca detail",
        scrollSpeed: "variable",
        readingTime: "very_long",
        viewableFocus: "maximum"
      }
    };

    // 🎯 AD DOMAINS WHITELIST DIPERBANYAK
    this.adDomains = [
      'googleads', 'doubleclick', 'googlesyndication', 'google-analytics',
      'adsystem', 'amazon-adsystem', 'facebook.com/tr', 'fbcdn',
      'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'criteo',
      'taboola', 'outbrain', 'revcontent', 'adsco.re', 'monetization',
      'adsafeprotected', 'advertising', 'ads-track', 'adservice'
    ];
  }

  // 🎯 FIXED BROWSER LAUNCH - COMPATIBLE DENGAN PUPPETEER 24+
  async launchBrowser(config, proxyUrl) {
    console.log('🚀 Launching browser dengan Puppeteer Extra + Stealth + Viewable Optimization...');
    
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
      '--disable-ipc-flooding-protection'
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
      console.log('✅ Browser launched successfully dengan Viewable Ads Optimization');
      return browser;
    } catch (error) {
      console.error('❌ Browser launch failed:', error.message);
      throw error;
    }
  }

  // 🎯 FIXED WAIT FUNCTION - COMPATIBLE DENGAN SEMUA VERSI PUPPETEER
  async waitForTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🎯 ENHANCED AD DETECTION DENGAN VIEWABLE VALIDATION
  async detectAdPage(page, sessionId) {
    try {
      const adData = await page.evaluate(() => {
        const adSelectors = [
          '.adsbygoogle', 'ins.adsbygoogle', 
          'iframe[src*="googleads"]', 'iframe[src*="doubleclick"]',
          '[id*="ad-container"]', '.ad-unit', '.ad-container',
          'div[id*="google_ads"]', '[data-google-query-id]',
          'a[href*="googleadservices.com"]', '.advertisement',
          '[data-ad-status]', '.ad-slot', '[data-ad-client]',
          // ✅ TAMBAHAN SELECTOR UNTUK BERBAGAI JENIS IKLAN
          '[class*="ad-" i]', '[id*="ad-" i]', 
          '.ad-banner', '.ad-wrapper', '.ad-placeholder',
          '.google-ad', '.ads-wrapper', '.advertising',
          // ✅ IKLAN LAZY LOADING
          '[data-ad-load]', '[data-ad-slot]', '.lazy-ad',
          // ✅ SELECTOR TAMBAHAN UNTUK VIEWABLE DETECTION
          '.ad-placement', '.ad-surface', '[data-ad-type]',
          '.ad-holder', '.ad-frame', '.ad-content'
        ];
        
        let detectedAds = [];
        let totalAds = 0;
        let visibleAds = 0;
        let viewableAds = 0;
        let largeViewableAds = 0; // Iklan dengan area besar
        
        for (const selector of adSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            totalAds += elements.length;
            
            for (const element of elements) {
              const rect = element.getBoundingClientRect();
              const isInViewport = rect.top >= 0 && 
                                  rect.left >= 0 && 
                                  rect.bottom <= (window.innerHeight + 100) && // Buffer 100px
                                  rect.right <= (window.innerWidth + 100);
              
              const isVisible = rect.width > 10 && rect.height > 10;
              const isLargeAd = (rect.width * rect.height) > 50000; // Area > 50,000 pixels
              
              if (isVisible) {
                visibleAds++;
                
                if (isInViewport) {
                  viewableAds++;
                  if (isLargeAd) largeViewableAds++;
                  
                  detectedAds.push({
                    selector: selector,
                    position: { top: rect.top, left: rect.left },
                    size: { width: rect.width, height: rect.height },
                    viewable: true,
                    area: rect.width * rect.height,
                    isLarge: isLargeAd,
                    elementTop: element.offsetTop
                  });
                  
                  // ✅ TRIGGER LAZY LOADING JIKA ADA
                  if (element.getAttribute('data-ad-load') === 'lazy' || 
                      element.classList.contains('lazy-ad')) {
                    try {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch (e) {
                      // Ignore scroll errors
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
                    elementTop: element.offsetTop
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
          detectedAds,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: Date.now()
        };
      });
      
      if (adData.viewableAds > 0) {
        this.log(sessionId, 'AD_VIEWABLE_DETECTED', 
          `🎯 ${adData.viewableAds} VIEWABLE ADS (${adData.largeViewableAds} besar) dari ${adData.visibleAds} visible - VIEWABLE MODE AKTIF`);
        return {
          hasAds: true,
          viewableCount: adData.viewableAds,
          largeViewableCount: adData.largeViewableAds,
          totalCount: adData.totalAds,
          isViewable: true,
          detectedAds: adData.detectedAds,
          viewport: adData.viewport
        };
      } else if (adData.visibleAds > 0) {
        this.log(sessionId, 'AD_VISIBLE_ONLY', 
          `👀 ${adData.visibleAds} iklan visible TAPI TIDAK VIEWABLE - PERLU SCROLL OPTIMIZATION`);
        return {
          hasAds: true,
          viewableCount: 0,
          largeViewableCount: 0,
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
        totalCount: 0,
        isViewable: false,
        detectedAds: [],
        error: error.message
      };
    }
  }

  // 🎯 ENHANCED SCROLL UNTUK MEMBUAT IKLAN VIEWABLE
  async scrollToMakeAdsViewable(page, sessionId, adData) {
    try {
      if (!adData.hasAds || adData.isViewable) {
        return true;
      }

      this.log(sessionId, 'SCROLL_FOR_VIEWABLE', 
        `🔄 Scroll optimization untuk membuat ${adData.totalCount} iklan menjadi VIEWABLE...`);
      
      // Filter hanya iklan yang tidak viewable
      const nonViewableAds = adData.detectedAds.filter(ad => !ad.viewable && ad.area > 1000);
      
      if (nonViewableAds.length === 0) {
        this.log(sessionId, 'NO_ADS_TO_SCROLL', 'Tidak ada iklan yang perlu di-scroll');
        return true;
      }

      let madeViewable = 0;

      for (const ad of nonViewableAds.slice(0, 3)) { // Maksimal 3 iklan untuk di-scroll
        // Hitung posisi scroll optimal (tengah viewport)
        const scrollTarget = ad.elementTop - (adData.viewport.height / 2) + (ad.size.height / 2);
        
        this.log(sessionId, 'SCROLL_TO_AD', 
          `📏 Scroll ke iklan di posisi ${Math.round(scrollTarget)}px (current: ${ad.position.top}px)`);
        
        await page.evaluate((target) => {
          window.scrollTo({
            top: target,
            behavior: 'smooth'
          });
        }, scrollTarget);
        
        // ✅ TUNGGU LEBIH LAMA UNTUK VIEWABLE LOADING (3-5 detik)
        const waitTime = 3000 + (Math.random() * 2000);
        this.log(sessionId, 'VIEWABLE_LOAD_WAIT', `⏳ Tunggu ${Math.round(waitTime/1000)}s untuk viewable load...`);
        await this.waitForTimeout(waitTime);
        
        // Cek apakah iklan sekarang viewable
        const currentAdData = await this.detectAdPage(page, sessionId);
        if (currentAdData.isViewable) {
          madeViewable++;
          this.log(sessionId, 'AD_NOW_VIEWABLE', 
            `✅ Iklan berhasil menjadi VIEWABLE setelah scroll (${madeViewable}/${nonViewableAds.length})`);
          
          // ✅ EXTRA DWELL TIME PADA IKLAN YANG BARU JADI VIEWABLE
          await this.waitForTimeout(2000);
        } else {
          this.log(sessionId, 'AD_STILL_NOT_VIEWABLE', '⚠️ Iklan masih tidak viewable setelah scroll');
        }
        
        // Random pause antara scroll
        if (Math.random() > 0.5) {
          await this.waitForTimeout(1000 + (Math.random() * 2000));
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

  // 🎯 ENHANCED AD INTERACTION DENGAN VIEWABLE FOCUS
  async comprehensiveAdInteraction(page, sessionId, multiplier = 1.0) {
    try {
      this.log(sessionId, 'COMPREHENSIVE_AD_INTERACTION', 'Memulai interaksi iklan dengan FOKUS VIEWABLE...');
      
      // ✅ DETEKSI IKLAN SEBELUM MEMULAI
      const initialAdData = await this.detectAdPage(page, sessionId);
      
      if (!initialAdData.hasAds) {
        this.log(sessionId, 'NO_ADS_FOUND', '❌ Tidak ada iklan yang ditemukan - skip interaksi');
        return false;
      }
      
      // ✅ BUAT IKLAN VIEWABLE JIKA PERLU
      if (!initialAdData.isViewable) {
        await this.scrollToMakeAdsViewable(page, sessionId, initialAdData);
        // Deteksi ulang setelah scroll
        await this.waitForTimeout(2000);
      }
      
      const currentAdData = await this.detectAdPage(page, sessionId);
      let interactionCount = 0;
      let viewableInteractions = 0;
      
      // ✅ SCROLL PATTERN YANG OPTIMAL UNTUK VIEWABLE ADS
      const scrollPositions = [100, 250, 450, 650, 850, 1050, 1250, 1450, 1650, 1850];
      
      for (let i = 0; i < scrollPositions.length; i++) {
        const position = scrollPositions[i];
        
        await page.evaluate((pos) => {
          window.scrollTo({
            top: pos,
            behavior: 'smooth'
          });
        }, position);
        
        // ✅ TUNGGU LEBIH LAMA SETIAP SCROLL UNTUK VIEWABLE TRACKING (2.5-4 detik)
        const scrollWaitTime = this.iterationConfig.scrollDwellTime * multiplier * (0.8 + Math.random() * 0.4);
        this.log(sessionId, 'SCROLL_DWELL', 
          `⏸️  Dwell time ${Math.round(scrollWaitTime/1000)}s di posisi ${position}px`);
        await this.waitForTimeout(scrollWaitTime);
        
        // ✅ DETEKSI IKLAN SETIAP SCROLL UNTUK MEMASTIKAN VIEWABLE
        const scrollAdData = await this.detectAdPage(page, sessionId);
        
        if (scrollAdData.isViewable) {
          viewableInteractions++;
          
          // ✅ INTERAKSI HANYA PADA IKLAN VIEWABLE
          const hoverResult = await page.evaluate(() => {
            const viewportHeight = window.innerHeight;
            const adElements = document.querySelectorAll([
              '.adsbygoogle', 'ins.adsbygoogle', 
              'iframe[src*="googleads"]', '[id*="ad-container"]',
              '.ad-unit', '.ad-container', 'div[id*="google_ads"]'
            ].join(','));
            
            let hoverCount = 0;
            let viewableHoverCount = 0;
            
            for (const element of adElements) {
              try {
                const rect = element.getBoundingClientRect();
                // ✅ HANYA INTERAKSI DENGAN IKLAN DI VIEWPORT (dengan buffer)
                const isInViewport = rect.top >= -50 && rect.top < (viewportHeight + 50) && 
                                   rect.width > 10 && rect.height > 10;
                
                if (isInViewport) {
                  // ✅ MULTIPLE EVENTS UNTUK BETTER TRACKING
                  const events = ['mouseenter', 'mouseover', 'mousemove'];
                  events.forEach(eventType => {
                    const event = new MouseEvent(eventType, {
                      view: window,
                      bubbles: true,
                      cancelable: true,
                      clientX: rect.left + rect.width / 2,
                      clientY: rect.top + rect.height / 2
                    });
                    element.dispatchEvent(event);
                  });
                  
                  hoverCount++;
                  if (rect.top >= 0 && rect.top < viewportHeight) {
                    viewableHoverCount++;
                  }
                }
              } catch (e) {
                continue;
              }
            }
            return { total: hoverCount, viewable: viewableHoverCount };
          });
          
          if (hoverResult.total > 0) {
            interactionCount += hoverResult.total;
            this.log(sessionId, 'VIEWABLE_INTERACTION', 
              `🖱️  ${hoverResult.viewable} interaksi VIEWABLE + ${hoverResult.total - hoverResult.viewable} visible di posisi ${position}px`);
          }
        }
        
        // ✅ RANDOM PAUSES LEBIH PANJANG UNTUK VIEWABLE DWELL TIME
        if (Math.random() > 0.6) { // 40% chance untuk extended pause
          const extendedPause = 2000 + (Math.random() * 3000);
          this.log(sessionId, 'EXTENDED_VIEWABLE_PAUSE', 
            `⏸️  Extended pause ${Math.round(extendedPause/1000)}s untuk viewable dwell time`);
          await this.waitForTimeout(extendedPause * multiplier);
        }
        
        // ✅ MICRO-SCROLL RANDOM UNTUK NATURAL BEHAVIOR
        if (Math.random() > 0.7 && i < scrollPositions.length - 1) {
          await this.microScroll(page, sessionId);
        }
      }
      
      this.log(sessionId, 'COMPREHENSIVE_AD_SUCCESS', 
        `✅ Interaksi selesai: ${interactionCount} total interaksi (${viewableInteractions} scroll posisi dengan iklan VIEWABLE)`);
      return interactionCount > 0;
      
    } catch (error) {
      this.log(sessionId, 'COMPREHENSIVE_AD_ERROR', `Error interaksi iklan: ${error.message}`);
      return false;
    }
  }

  // 🎯 MICRO SCROLL UNTUK NATURAL BEHAVIOR
  async microScroll(page, sessionId) {
    try {
      const scrollAmount = 30 + (Math.random() * 120); // 30-150px
      await page.evaluate((amount) => {
        window.scrollBy({
          top: amount,
          behavior: 'smooth'
        });
      }, scrollAmount);
      
      await this.waitForTimeout(800 + (Math.random() * 1200));
    } catch (error) {
      // Ignore micro-scroll errors
    }
  }

  // 🎯 ENHANCED READING PAUSE UNTUK VIEWABLE TIME REQUIREMENT
  async extendedReadingPause(sessionId, contentComplexity, adData, multiplier = 1.0) {
    const pattern = this.getSessionPattern(sessionId);
    
    let baseMin, baseMax;
    
    // ✅ PENYESUAIAN WAKTU BERDASARKAN ADA/TIDAKNYA VIEWABLE ADS
    if (adData.isViewable) {
      // WAKTU LEBIH PANJANG JIKA ADA VIEWABLE ADS (minimal untuk viewable counting)
      switch(contentComplexity) {
        case 'simple': 
          baseMin = 8000; baseMax = 15000; // 8-15 detik
          break;
        case 'complex': 
          baseMin = 15000; baseMax = 30000; // 15-30 detik  
          break;
        case 'medium': default: 
          baseMin = 10000; baseMax = 20000; // 10-20 detik
          break;
      }
      this.log(sessionId, 'VIEWABLE_READING_EXTENDED', 
        `📊 Extended reading time (${baseMin/1000}-${baseMax/1000}s) karena ${adData.viewableCount} VIEWABLE ADS`);
    } else if (adData.hasAds) {
      // Waktu medium jika ada iklan tapi tidak viewable
      switch(contentComplexity) {
        case 'simple': baseMin = 5000; baseMax = 10000; break;
        case 'complex': baseMin = 10000; baseMax = 20000; break;
        case 'medium': default: baseMin = 7000; baseMax = 15000; break;
      }
    } else {
      // Waktu normal jika tidak ada iklan
      switch(contentComplexity) {
        case 'simple': baseMin = 3000; baseMax = 8000; break;
        case 'complex': baseMin = 8000; baseMax = 15000; break;
        case 'medium': default: baseMin = 5000; baseMax = 10000; break;
      }
    }
    
    const minMs = baseMin * pattern.finalMultiplier * multiplier;
    const maxMs = baseMax * pattern.finalMultiplier * multiplier;
    const totalDelay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    
    this.log(sessionId, 'EXTENDED_READING_PAUSE', 
      `📖 Reading: ${Math.round(totalDelay/1000)}s [${adData.isViewable ? 'VIEWABLE' : (adData.hasAds ? 'HAS_ADS' : 'NO_ADS')}]`);
    
    // ✅ BREAK DOWN READING TIME UNTUK LEBIH NATURAL DENGAN MICRO-INTERACTIONS
    const chunkSize = 4000; // 4 detik per chunk
    const chunks = Math.ceil(totalDelay / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
      const chunkDelay = Math.min(chunkSize, totalDelay - (i * chunkSize));
      await this.waitForTimeout(chunkDelay);
      
      // ✅ RANDOM MICRO-INTERACTIONS SELAMA READING (30% chance)
      if (Math.random() > 0.7 && i < chunks - 1) {
        await this.microScroll(this.page, sessionId);
      }
    }
    
    return true;
  }

  // 🎯 ENHANCED HUMAN SCROLL DENGAN VIEWABLE OPTIMIZATION
  async humanScroll(page, sessionId, multiplier = 1.0) {
    const pattern = this.getSessionPattern(sessionId);
    
    try {
      await page.evaluate(async (patternData, speedMultiplier) => {
        await new Promise((resolve) => {
          const totalHeight = document.body.scrollHeight;
          const viewportHeight = window.innerHeight;
          const scrollableHeight = totalHeight - viewportHeight;
          const targetScroll = Math.min(scrollableHeight * 0.85, 6000); // 85% atau max 6000px
          
          let currentScroll = 0;
          let scrollDirection = 1;
          let scrollCount = 0;
          let consecutiveDirectionChanges = 0;
          let lastScrollTime = Date.now();
          
          const getScrollSpeed = () => {
            let baseSpeed = 40;
            if (patternData.patternType === 'FAST_READER') baseSpeed = 60;
            if (patternData.patternType === 'SLOW_READER') baseSpeed = 25;
            if (patternData.patternType === 'DETAILED_READER') baseSpeed = 30;
            
            return baseSpeed * speedMultiplier * (0.6 + Math.random() * 0.8);
          };
          
          const getScrollDelay = () => {
            let baseDelay = 100;
            if (patternData.patternType === 'FAST_READER') baseDelay = 60;
            if (patternData.patternType === 'SLOW_READER') baseDelay = 150;
            if (patternData.patternType === 'DETAILED_READER') baseDelay = 120;
            return baseDelay * speedMultiplier;
          };
          
          const shouldPause = () => {
            const pauseChance = patternData.patternType === 'DETAILED_READER' ? 0.25 : 
                              patternData.patternType === 'SLOW_READER' ? 0.2 : 0.15;
            return Math.random() < pauseChance;
          };
          
          const shouldChangeDirection = () => {
            const changeChance = patternData.patternType === 'DETAILED_READER' ? 0.12 : 0.08;
            return Math.random() < changeChance && consecutiveDirectionChanges < 2;
          };
          
          const scrollStep = () => {
            scrollCount++;
            lastScrollTime = Date.now();
            
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
            
            // Random pauses untuk viewable dwell time
            if (shouldPause()) {
              clearInterval(scrollInterval);
              const pauseTime = patternData.patternType === 'DETAILED_READER' ? 
                1200 + Math.random() * 2500 : 800 + Math.random() * 1800;
              
              setTimeout(() => {
                scrollInterval = setInterval(scrollStep, getScrollDelay());
              }, pauseTime);
            }
            
            // Completion conditions
            const timeElapsed = Date.now() - lastScrollTime;
            if (scrollCount > 80 || (currentScroll >= targetScroll && scrollDirection === 1 && timeElapsed > 2000)) {
              clearInterval(scrollInterval);
              resolve();
            }
          };
          
          let scrollInterval = setInterval(scrollStep, getScrollDelay());
        });
      }, pattern, multiplier);
      
      this.log(sessionId, 'SCROLL_COMPLETE', 'Scroll manusiawi dengan viewable optimization selesai');
    } catch (error) {
      this.log(sessionId, 'SCROLL_ERROR', `Error scroll: ${error.message}`);
    }
  }

  // 🎯 ENHANCED FINAL AD ENGAGEMENT DENGAN VIEWABLE FOCUS
  async finalAdEngagement(page, sessionId) {
    try {
      this.log(sessionId, 'FINAL_AD_ENGAGEMENT', 'Interaksi final dengan fokus pada VIEWABLE ads...');
      
      // Scroll akhir untuk capture semua potential viewable ads
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await this.waitForTimeout(3000);
      
      // Deteksi iklan di akhir session
      const finalAdData = await this.detectAdPage(page, sessionId);
      
      if (finalAdData.isViewable) {
        this.log(sessionId, 'FINAL_VIEWABLE_ADS', 
          `🎯 ${finalAdData.viewableCount} VIEWABLE ADS ditemukan di akhir session - final engagement`);
        
        // Final hover pada semua iklan viewable
        await page.evaluate(() => {
          const adElements = document.querySelectorAll('.adsbygoogle, ins.adsbygoogle, [id*="ad"]');
          adElements.forEach((element, index) => {
            try {
              const rect = element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && 
                  rect.top >= 0 && rect.top < window.innerHeight) {
                
                // Multiple events untuk final engagement
                ['mouseenter', 'mouseover'].forEach(eventType => {
                  const event = new MouseEvent(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2
                  });
                  element.dispatchEvent(event);
                });
              }
            } catch (e) {
              // Ignore errors
            }
          });
        });
        
        this.log(sessionId, 'FINAL_VIEWABLE_SUCCESS', 
          `✅ Final engagement selesai pada ${finalAdData.viewableCount} viewable ads`);
      } else {
        this.log(sessionId, 'NO_FINAL_VIEWABLE', 'Tidak ada viewable ads untuk final engagement');
      }
      
    } catch (error) {
      this.log(sessionId, 'FINAL_AD_ERROR', `Error interaksi final: ${error.message}`);
    }
  }

  // 🎯 ENHANCED MAIN EXECUTION DENGAN VIEWABLE OPTIMIZATION
  async executeAllSteps(page, sessionId, config) {
    this.page = page; // Set page instance untuk microScroll
    
    const pattern = this.getSessionPattern(sessionId);
    this.log(sessionId, 'SESSION_PATTERN', 
      `Pattern: ${pattern.description} (${pattern.patternType}) - Viewable Focus: ${pattern.viewableFocus}`);

    const iterationCount = Math.floor(Math.random() * 
      (this.iterationConfig.maxIterations - this.iterationConfig.minIterations + 1)) + 
      this.iterationConfig.minIterations;
    
    this.log(sessionId, 'ITERATION_SETUP', `Akan melakukan ${iterationCount} iterasi dengan viewable optimization`);

    let currentUrl = config.targetUrl;
    let totalViewableInteractions = 0;
    let totalViewableAdsDetected = 0;
    
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
          this.log(sessionId, 'VIEWABLE_MODE_ACTIVE', 
            `🎯 ${initialAdData.viewableCount} VIEWABLE ADS terdeteksi - AKTIFKAN VIEWABLE OPTIMIZATION`);
        }

        const contentComplexity = await this.analyzeContentComplexity(page);
        
        // 🎯 OPTIMIZED STEP SEQUENCE UNTUK VIEWABLE ADS
        const steps = [
          {
            name: 'INITIAL_READING_VIEWABLE',
            action: async () => {
              this.log(sessionId, 'VIEWABLE_READING', 'Membaca konten dengan viewable optimization...');
              await this.extendedReadingPause(sessionId, contentComplexity, initialAdData, timeMultiplier);
            },
            timeout: 60000
          },
          {
            name: 'VIEWABLE_AD_INTERACTION',
            action: async () => {
              this.log(sessionId, 'VIEWABLE_INTERACTION', 'Interaksi optimized untuk viewable ads...');
              const result = await this.comprehensiveAdInteraction(page, sessionId, timeMultiplier);
              if (result) totalViewableInteractions++;
            },
            timeout: 180000
          },
          {
            name: 'DEEP_VIEWABLE_SCROLL',
            action: async () => {
              this.log(sessionId, 'DEEP_VIEWABLE_SCROLL', 'Scroll mendalam untuk maksimalkan viewable exposure...');
              await this.humanScroll(page, sessionId, timeMultiplier);
              
              // ✅ POST-SCROLL AD DETECTION
              const postScrollAdData = await this.detectAdPage(page, sessionId);
              if (postScrollAdData.isViewable && !initialAdData.isViewable) {
                this.log(sessionId, 'SCROLL_CREATED_VIEWABLE', 
                  `✅ Scroll berhasil membuat ${postScrollAdData.viewableCount} iklan menjadi VIEWABLE`);
              }
            },
            timeout: 150000
          },
          {
            name: 'FINAL_VIEWABLE_ENGAGEMENT',
            action: async () => {
              this.log(sessionId, 'FINAL_VIEWABLE_ENGAGEMENT', 'Final engagement dengan viewable ads...');
              await this.finalAdEngagement(page, sessionId);
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
            this.log(sessionId, `${step.name}_COMPLETE`, 
              `Step selesai (${Math.round(stepDuration/1000)} detik)`);
            
            // Random delay antara steps
            if (index < steps.length - 1) {
              await this.waitForTimeout(4000 * timeMultiplier);
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
      `🎉 Semua ${iterationCount} iterasi selesai! Total: ${totalViewableInteractions} interaksi VIEWABLE, ${totalViewableAdsDetected} viewable ads terdeteksi`);

    // Reset page reference
    this.page = null;
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

  // 🎯 ENHANCED NAVIGATION DENGAN BETTER ERROR HANDLING
  async navigateWithRetry(page, url, sessionId, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(sessionId, 'NAVIGATION_ATTEMPT', `Navigasi attempt ${attempt}/${maxRetries} ke: ${url}`);
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        this.log(sessionId, 'NAVIGATION_SUCCESS', '✅ Berhasil navigasi ke halaman');
        return true;
        
      } catch (error) {
        this.log(sessionId, 'NAVIGATION_RETRY', 
          `Attempt ${attempt}/${maxRetries} gagal: ${error.message}`);
        
        if (attempt < maxRetries) {
          await this.waitForTimeout(5000);
        } else {
          throw error;
        }
      }
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

  // 🎯 SESSION MANAGEMENT (TETAP SAMA)
  async startNewSession(config) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log(sessionId, 'SESSION_INIT', 'Menginisialisasi session baru dengan VIEWABLE optimization...');
    
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
        await this.waitForTimeout(5000);
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

      this.log(sessionId, 'STEP_1', 'Meluncurkan browser dengan proxy + stealth + viewable optimization...');
      browser = await this.launchBrowser(config, currentProxy.url);
      
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

      // Setup interception
      await this.setupAdFriendlyInterception(page, sessionId);

      this.log(sessionId, 'STEP_1_COMPLETE', 'Browser berhasil diluncurkan dengan viewable optimization');

      this.log(sessionId, 'STEP_2', `Navigasi ke: ${config.targetUrl}`);
      
      try {
        await this.navigateWithRetry(page, config.targetUrl, sessionId);
        
        this.log(sessionId, 'STEP_2_COMPLETE', 'Berhasil navigasi ke target URL');

        await this.executeAllSteps(page, sessionId, config);

        this.log(sessionId, 'SESSION_COMPLETED', 'Semua langkah berhasil diselesaikan dengan viewable optimization');

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
    return {
      totalActive: this.proxyHandler.getRemainingCount(),
      totalFailed: 0,
      message: '🔧 Proxy system ready'
    };
  }
}

module.exports = TrafficGenerator;