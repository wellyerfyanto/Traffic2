document.addEventListener('DOMContentLoaded', function() {
    loadSystemStatus();
    checkAutoLoopStatus();
    
    document.getElementById('botConfig').addEventListener('submit', async function(e) {
        e.preventDefault();
        await startSessions();
    });
});

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
            alert('✅ Sessions started successfully dengan adaptive timeout proxy! Redirecting to monitoring...');
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
                    ⚡ Adaptive Timeout: ✅ ENABLED<br>
                    <small>Auto-loop akan berjalan dengan adaptive timeout proxy system</small>
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
                    ⚡ Adaptive Timeout: ✅ ENABLED<br>
                    <small>Terakhir diperiksa: ${new Date().toLocaleTimeString()}</small>
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
            alert('✅ Puppeteer test passed! System ready to use.\n\nChrome Path: ' + (result.chromePath || 'Default'));
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
                    ✅ <strong>System Ready</strong><br>
                    📍 Chrome Path: ${result.chromePath || 'Default'}<br>
                    💡 Message: ${result.message}<br>
                    🔒 PROXY: WAJIB DIGUNAKAN<br>
                    ⚡ ADAPTIVE TIMEOUT: ✅ ENABLED<br>
                    👤 ${uaInfo}<br>
                    <small>System akan menggunakan adaptive timeout berdasarkan kecepatan proxy</small>
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
                        <strong>⚡ Adaptive Timeout Settings:</strong><br>
                        🟢 FAST: 30 detik<br>
                        🟡 MEDIUM: 60 detik<br>
                        🟠 SLOW: 90 detik<br>
                        🔴 VERY_SLOW: 120 detik
                    </div>
                    
                    <small>Total Active Proxies: ${total} | Terakhir diperbarui: ${new Date().toLocaleTimeString()}</small>
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

setInterval(() => {
    checkAutoLoopStatus();
}, 30000);