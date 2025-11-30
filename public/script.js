document.addEventListener('DOMContentLoaded', function() {
    loadSystemStatus();
    checkAutoLoopStatus();
    
    // Add new test buttons to UI
    addAdTestingButtons();
    
    document.getElementById('botConfig').addEventListener('submit', async function(e) {
        e.preventDefault();
        await startSessions();
    });
});

// 🆕 NEW FUNCTION: Add Ad Testing Buttons to UI
function addAdTestingButtons() {
    const statusSection = document.querySelector('.status-section');
    if (statusSection && !document.getElementById('adTestingSection')) {
        const adTestingHTML = `
            <div class="config-section" id="adTestingSection">
                <h3>🔍 Ad Blocking & Detection Test</h3>
                <div class="form-actions">
                    <button type="button" onclick="testAdBlockingStatus()" style="background: linear-gradient(135deg, #3498db, #2980b9);">
                        🛡️ Test Ad Blocking Status
                    </button>
                    <button type="button" onclick="testUrlForAds()" style="background: linear-gradient(135deg, #9b59b6, #8e44ad);">
                        🌐 Test URL for Ads
                    </button>
                    <button type="button" onclick="testResourceLoading()" style="background: linear-gradient(135deg, #e67e22, #d35400);">
                        📊 Test Resource Loading
                    </button>
                </div>
                <div id="adTestResults" style="margin-top: 15px;"></div>
            </div>
        `;
        statusSection.insertAdjacentHTML('afterend', adTestingHTML);
    }
}

// 🆕 NEW FUNCTION: Test Ad Blocking Status
async function testAdBlockingStatus() {
    try {
        const resultsDiv = document.getElementById('adTestResults');
        resultsDiv.innerHTML = '<div style="color: #f39c12;">🔄 Testing ad blocking status...</div>';
        
        const response = await fetch('/api/ad-blocking-status');
        const result = await response.json();
        
        if (result.success) {
            const status = result.blockingStatus;
            const isBlocked = status.adBlockingDetected;
            const stylesheetBlocked = status.stylesheetBlocking;
            
            let statusHTML = `
                <div style="background: ${isBlocked ? '#fadbd8' : '#d5f4e6'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${isBlocked ? '#e74c3c' : '#27ae60'}; margin-bottom: 10px;">
                    <strong>${isBlocked ? '❌ AD BLOCKING DETECTED' : '✅ NO AD BLOCKING'}</strong><br>
                    ${result.message}
                </div>
                
                <div style="background: ${stylesheetBlocked ? '#fdebd0' : '#d5f4e6'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${stylesheetBlocked ? '#f39c12' : '#27ae60'}; margin-bottom: 10px;">
                    <strong>🎨 Stylesheet Status:</strong><br>
                    ${result.stylesheetMessage}<br>
                    <small>${status.stylesheetsWorking}/${status.stylesheetsTotal} stylesheets working</small>
                </div>
                
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                    <strong>📊 Resource Details:</strong><br>
                    📡 Ad Requests: ${status.adRequests}<br>
                    🎨 Stylesheets: ${status.stylesheetsWorking}/${status.stylesheetsTotal} working<br>
                    🖼️ Images: ${status.imagesLoaded}/${status.imagesTotal} loaded<br>
                    📦 Total Resources: ${status.totalResources}<br>
                    <small>Google Ads: ${status.resourceDetails.googleAds}, DoubleClick: ${status.resourceDetails.doubleclick}</small>
                </div>
            `;
            
            // Add recommendations
            if (isBlocked || stylesheetBlocked) {
                statusHTML += `
                    <div style="background: #fdebd0; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #f39c12;">
                        <strong>💡 Recommendations:</strong><br>
                        ${result.recommendations.map(rec => `• ${rec}<br>`).join('')}
                    </div>
                `;
            }
            
            resultsDiv.innerHTML = statusHTML;
        }
    } catch (error) {
        document.getElementById('adTestResults').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ Error testing ad blocking: ${error.message}
            </div>
        `;
    }
}

// 🆕 NEW FUNCTION: Test Specific URL for Ads
async function testUrlForAds() {
    const testUrl = prompt('Enter URL to test for ads:', 'https://www.cnn.com');
    if (!testUrl) return;
    
    try {
        const resultsDiv = document.getElementById('adTestResults');
        resultsDiv.innerHTML = '<div style="color: #f39c12;">🔄 Testing URL for ads... (15 seconds)</div>';
        
        const response = await fetch('/api/test-ads-detection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testUrl })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const adData = result.adData;
            
            let resultsHTML = `
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 10px;">
                    <strong>🔍 Ads Detection Result for ${testUrl}</strong><br>
                    📊 Total Ads Found: <strong style="font-size: 1.2em;">${adData.totalAdsFound}</strong><br>
                    👀 Visible Ads: ${adData.visibleAds}<br>
                    🎯 Viewable Ads: ${adData.viewableAds}<br>
                    📝 Ads with Content: ${adData.adsWithContent}<br>
                    🖼️ Ad Iframes: ${adData.adIframes}<br>
                    💡 Status: <strong>${result.status}</strong>
                </div>
                
                <div style="background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 10px;">
                    <strong>⚙️ Configuration:</strong><br>
                    ${result.resourceLoading}<br>
                    ⏱️ Wait Time: ${result.technicalDetails.waitTime}<br>
                    🚫 Interception: ${result.technicalDetails.interception}<br>
                    🎨 Stylesheets: ${result.technicalDetails.stylesheets}<br>
                    🖼️ Images: ${result.technicalDetails.images}
                </div>
            `;
            
            // Show ad details if any found
            if (adData.ads.length > 0) {
                resultsHTML += `
                    <div style="background: #f4ecf7; padding: 15px; border-radius: 8px; border-left: 4px solid #9b59b6;">
                        <strong>📋 Ad Details (first ${adData.ads.length}):</strong><br>
                        ${adData.ads.map((ad, index) => `
                            <small>${index + 1}. ${ad.selector} - ${ad.size.width}x${ad.size.height} - ${ad.visible ? '👀' : '❌'} - ${ad.inViewport ? '🎯' : '📤'}</small><br>
                        `).join('')}
                    </div>
                `;
            }
            
            // Add suggestions
            resultsHTML += `
                <div style="background: #fdebd0; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <strong>💡 Suggestions:</strong><br>
                    ${result.suggestions.map(suggestion => `• ${suggestion}<br>`).join('')}
                </div>
            `;
            
            resultsDiv.innerHTML = resultsHTML;
        }
    } catch (error) {
        document.getElementById('adTestResults').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ Error testing URL: ${error.message}
            </div>
        `;
    }
}

// 🆕 NEW FUNCTION: Test Resource Loading for Active Session
async function testResourceLoading() {
    try {
        // Get active sessions
        const response = await fetch('/api/all-sessions');
        const result = await response.json();
        
        if (result.success && result.sessions.length > 0) {
            const activeSession = result.sessions.find(s => s.status === 'running');
            if (activeSession) {
                const resourceResponse = await fetch(`/api/resource-report/${activeSession.id}`);
                const resourceResult = await resourceResponse.json();
                
                if (resourceResult.success) {
                    displayResourceReport(resourceResult);
                } else {
                    throw new Error('No active sessions found');
                }
            } else {
                throw new Error('No active sessions found');
            }
        } else {
            throw new Error('No sessions available');
        }
    } catch (error) {
        document.getElementById('adTestResults').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px;">
                ❌ Error testing resource loading: ${error.message}<br>
                <small>Start a session first to see resource reports</small>
            </div>
        `;
    }
}

// 🆕 NEW FUNCTION: Display Resource Report
function displayResourceReport(report) {
    const resultsDiv = document.getElementById('adTestResults');
    const summary = report.summary;
    
    let reportHTML = `
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 10px;">
            <strong>📊 Resource Loading Report</strong><br>
            Session: ${report.sessionId}<br>
            ⏱️ Duration: ${Math.round(summary.sessionDuration / 1000)} seconds<br>
            📡 Total Resources: ${summary.totalResources}<br>
            💰 Ad Resources: ${summary.adResources}<br>
            🎨 Stylesheets: ${summary.stylesheets}<br>
            🎯 Ads Detected: ${summary.totalAdsDetected}
        </div>
    `;
    
    // Show recent resource logs
    if (report.details.resourceLogs.length > 0) {
        reportHTML += `
            <div style="background: #f4ecf7; padding: 15px; border-radius: 8px; border-left: 4px solid #9b59b6; margin-bottom: 10px;">
                <strong>📝 Recent Resource Logs:</strong><br>
                ${report.details.resourceLogs.map(log => `
                    <small>${log.timestamp} - ${log.step}: ${log.message}</small><br>
                `).join('')}
            </div>
        `;
    }
    
    // Show recommendations
    reportHTML += `
        <div style="background: ${summary.adResources === 0 ? '#fadbd8' : '#d5f4e6'}; padding: 15px; border-radius: 8px;">
            <strong>💡 ${summary.adResources === 0 ? '🚨 Recommendations' : '✅ Status Good'}:</strong><br>
            ${report.recommendations.map(rec => `• ${rec}<br>`).join('')}
        </div>
    `;
    
    resultsDiv.innerHTML = reportHTML;
}

// Existing functions (tetap sama dengan enhancements)
async function startSessions() {
    const startBtn = document.getElementById('startBtn');
    const originalText = startBtn.textContent;
    
    try {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
        
        const proxySource = document.querySelector('input[name="proxySource"]:checked').value;
        const proxies = document.getElementById('proxies').value.split('\n').filter(p => p.trim());
        
        const formData = {
            targetUrl: document.getElementById('targetUrl').value,
            profiles: document.getElementById('profiles').value,
            deviceType: document.getElementById('deviceType').value,
            proxySource: proxySource,
            proxies: proxies,
            proxyCount: parseInt(document.getElementById('proxyCount').value) || 5,
            autoLoop: document.getElementById('autoLoop').checked
        };
        
        const backupProxies = document.getElementById('backupProxies').value.split('\n').filter(p => p.trim());

        if (proxySource === 'auto' && backupProxies.length > 0) {
            formData.backupProxies = backupProxies;
        }

        if (proxySource === 'manual' && formData.proxies.length === 0) {
            alert('❌ Untuk proxy manual, wajib memasukkan minimal 1 proxy!');
            return;
        }
        
        if (!formData.targetUrl) {
            alert('❌ Target URL wajib diisi!');
            return;
        }

        const response = await fetch('/api/start-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('✅ Sessions started dengan NO RESOURCE BLOCKING! Redirecting to monitoring...');
            setTimeout(() => {
                window.location.href = '/monitoring';
            }, 2000);
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = originalText;
    }
}

async function startAutoLoop() {
    try {
        const proxySource = document.querySelector('input[name="proxySource"]:checked').value;
        const proxies = document.getElementById('proxies').value.split('\n').filter(p => p.trim());
        const targetUrl = document.getElementById('targetUrl').value;
        
        if (!targetUrl) {
            alert('❌ Target URL wajib diisi untuk auto-loop!');
            return;
        }

        if (proxySource === 'manual' && proxies.length === 0) {
            alert('❌ Untuk auto-loop dengan proxy manual, wajib memasukkan minimal 1 proxy!');
            return;
        }

        const config = {
            interval: parseInt(document.getElementById('loopInterval').value) * 60 * 1000,
            maxSessions: parseInt(document.getElementById('maxSessions').value),
            targetUrl: targetUrl,
            proxySource: proxySource,
            proxies: proxies,
            proxyCount: parseInt(document.getElementById('proxyCount').value) || 5
        };

        if (config.interval < 300000) {
            alert('❌ Interval minimum 5 menit');
            return;
        }

        const response = await fetch('/api/auto-loop/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('autoLoopStatus').innerHTML = 
                `<div style="color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                    <strong>✅ ${result.message}</strong><br>
                    ⏰ Interval: ${config.interval/60000} menit<br>
                    📊 Max Sessions: ${config.maxSessions}<br>
                    🌐 Target: ${config.targetUrl}<br>
                    🔌 Proxy: ${config.proxySource.toUpperCase()}<br>
                    🚫 Resource Blocking: DISABLED<br>
                    🎨 All Stylesheets: ALLOWED<br>
                    <small>Auto-loop berjalan dengan NO RESOURCE BLOCKING system</small>
                </div>`;
                
            setTimeout(checkAutoLoopStatus, 10000);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    }
}

async function stopAutoLoop() {
    if (!confirm('Yakin ingin menghentikan AUTO-LOOP? Semua session akan berhenti.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/auto-loop/stop', {
            method: 'POST'
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('autoLoopStatus').innerHTML = 
                `<div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                    ⏹️ <strong>${result.message}</strong><br>
                    <small>Auto-loop telah dihentikan.</small>
                </div>`;
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        alert('❌ Network error: ' + error.message);
    }
}

async function checkAutoLoopStatus() {
    try {
        const response = await fetch('/api/auto-loop/status');
        const result = await response.json();

        const statusDiv = document.getElementById('autoLoopStatus');
        if (result.success) {
            const statusColor = result.config.enabled ? '#27ae60' : '#e74c3c';
            const statusText = result.config.enabled ? '🟢 RUNNING' : '🔴 STOPPED';
            const statusBg = result.config.enabled ? '#d5f4e6' : '#fadbd8';
            
            statusDiv.innerHTML = `
                <div style="background: ${statusBg}; padding: 15px; border-radius: 8px; border-left: 4px solid ${statusColor};">
                    <strong>Auto-Loop Status: ${statusText}</strong><br>
                    ⏰ Interval: ${result.config.interval/60000} menit<br>
                    📊 Max Sessions: ${result.config.maxSessions}<br>
                    🎯 Active Sessions: <strong>${result.activeSessions}/${result.config.maxSessions}</strong><br>
                    🌐 Target: ${result.config.targetUrl}<br>
                    🔌 Proxy: ${result.config.proxySource ? result.config.proxySource.toUpperCase() : 'MANUAL'}<br>
                    🚫 Resource Blocking: DISABLED<br>
                    🎨 All Stylesheets: ALLOWED<br>
                    <small>Mode: NO RESOURCE BLOCKING - Terakhir diperiksa: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            
            if (result.config.enabled) {
                setTimeout(checkAutoLoopStatus, 10000);
            }
        }
    } catch (error) {
        document.getElementById('autoLoopStatus').innerHTML = 
            `<div style="color: #e74c3c;">
                ❌ Tidak dapat terhubung ke server
            </div>`;
    }
}

async function testPuppeteer() {
    try {
        const testBtn = document.querySelector('button[onclick="testPuppeteer()"]');
        const originalText = testBtn.textContent;
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        
        const response = await fetch('/api/test-puppeteer');
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Puppeteer test passed! System ready dengan NO RESOURCE BLOCKING.\n\nChrome Path: ' + (result.executablePath || 'Default') + '\nMode: ' + result.configuration.requestInterception);
        } else {
            alert('❌ Puppeteer test failed: ' + result.error);
        }
        
        testBtn.disabled = false;
        testBtn.textContent = originalText;
    } catch (error) {
        alert('❌ Test error: ' + error.message);
    }
}

async function loadSystemStatus() {
    try {
        const response = await fetch('/api/test-puppeteer');
        const result = await response.json();
        
        const statusDiv = document.getElementById('systemStatus');
        
        if (result.success) {
            // Get user agent count
            const uaResponse = await fetch('/api/user-agents/count');
            const uaResult = await uaResponse.json();
            
            const uaInfo = uaResult.success ? 
                `User Agents: Desktop ${uaResult.counts.desktop}, Mobile ${uaResult.counts.mobile}` : 
                'User Agents: Extended Database';
            
            statusDiv.innerHTML = `
                <div style="color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                    ✅ <strong>System Ready - NO RESOURCE BLOCKING</strong><br>
                    📍 Chrome Path: ${result.executablePath || 'Default'}<br>
                    🚫 Request Interception: ${result.configuration.requestInterception}<br>
                    🎨 Stylesheet Blocking: DISABLED<br>
                    🖼️ Image Blocking: DISABLED<br>
                    🔒 PROXY: WAJIB DIGUNAKAN<br>
                    👤 ${uaInfo}<br>
                    <small>System menggunakan NO RESOURCE BLOCKING untuk maximize ad loading</small>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                    ❌ <strong>System Error</strong><br>
                    📍 Error: ${result.error}<br>
                    <small>Periksa konfigurasi Puppeteer</small>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('systemStatus').innerHTML = `
            <div style="color: #e74c3c; background: #fadbd8; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                ❌ <strong>Connection Error</strong><br>
                📍 Cannot connect to server<br>
                <small>Pastikan server sedang berjalan</small>
            </div>
        `;
    }
}

async function analyzeProxySpeed() {
    try {
        const response = await fetch('/api/proxy-speed-analysis');
        const result = await response.json();
        
        if (result.success) {
            const analysis = result.speedAnalysis;
            const total = analysis.total;
            
            let html = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    <h4>📈 Speed Distribution Analysis</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0;">
                        <div style="text-align: center; padding: 10px; background: #27ae60; color: white; border-radius: 5px;">
                            <strong>FAST</strong><br>${analysis.fast}<br>(${((analysis.fast/total)*100).toFixed(1)}%)<br>
                            <small>≤ 2s</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #f39c12; color: white; border-radius: 5px;">
                            <strong>MEDIUM</strong><br>${analysis.medium}<br>(${((analysis.medium/total)*100).toFixed(1)}%)<br>
                            <small>≤ 5s</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #e67e22; color: white; border-radius: 5px;">
                            <strong>SLOW</strong><br>${analysis.slow}<br>(${((analysis.slow/total)*100).toFixed(1)}%)<br>
                            <small>≤ 10s</small>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #e74c3c; color: white; border-radius: 5px;">
                            <strong>VERY SLOW</strong><br>${analysis.verySlow}<br>(${((analysis.verySlow/total)*100).toFixed(1)}%)<br>
                            <small>> 10s</small>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #e8f4fd; border-radius: 5px;">
                        <strong>⚡ System Configuration:</strong><br>
                        🚫 Request Interception: DISABLED<br>
                        🎨 All Stylesheets: ALLOWED<br>
                        🖼️ All Images: ALLOWED<br>
                        ⏱️ Ad Loading Wait: 15+ seconds
                    </div>
                    
                    <small>Total Active Proxies: ${total} | Mode: NO RESOURCE BLOCKING | Terakhir diperbarui: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            
            document.getElementById('speedAnalysis').innerHTML = html;
        }
    } catch (error) {
        document.getElementById('speedAnalysis').innerHTML = 
            `<div style="color: #e74c3c; background: #fadbd8; padding: 10px; border-radius: 5px;">
                ❌ Error analyzing proxy speed: ${error.message}
            </div>`;
    }
}

function goToMonitoring() {
    window.location.href = '/monitoring';
}

function clearSessions() {
    if (confirm('Yakin ingin menghentikan SEMUA sessions dan menghapus logs?')) {
        fetch('/api/clear-sessions', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('✅ All sessions cleared!');
                loadSystemStatus();
                checkAutoLoopStatus();
            } else {
                alert('❌ Error: ' + result.error);
            }
        })
        .catch(error => {
            alert('❌ Network error: ' + error.message);
        });
    }
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

// Auto-refresh status
setInterval(() => {
    checkAutoLoopStatus();
}, 30000);