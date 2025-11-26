[file name]: script.js
[file content begin]
// public/script.js - Frontend Logic Lengkap dengan Auto-loop
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

        if (proxySource === 'manual' && formData.proxies.length === 0) {
            alert('❌ Untuk proxy manual, wajib memasukkan minimal 1 proxy!');
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
            alert('✅ Sessions started successfully dengan proxy! Redirecting to monitoring...');
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
        
        if (proxySource === 'manual' && proxies.length === 0) {
            alert('❌ Untuk auto-loop dengan proxy manual, wajib memasukkan minimal 1 proxy!');
            return;
        }

        const config = {
            interval: parseInt(document.getElementById('loopInterval').value) * 60 * 1000,
            maxSessions: parseInt(document.getElementById('maxSessions').value),
            targetUrl: document.getElementById('targetUrl').value || 'https://github.com',
            proxySource: proxySource,
            proxies: proxies,
            proxyCount: parseInt(document.getElementById('proxyCount').value) || 5
        };

        if (!config.targetUrl) {
            alert('❌ Please enter target URL');
            return;
        }

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
                    <small>Auto-loop akan berjalan dengan proxy yang sudah di-test</small>
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
    if (!confirm('Are you sure you want to stop AUTO-LOOP? Semua session akan berhenti.')) {
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
                    <small>Last checked: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            
            if (result.config.enabled) {
                setTimeout(checkAutoLoopStatus, 10000);
            }
        }
    } catch (error) {
        document.getElementById('autoLoopStatus').innerHTML = 
            `<div style="color: #e74c3c;">
                ❌ Cannot connect to server
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
            statusDiv.innerHTML = `
                <div style="color: #27ae60; background: #d5f4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                    ✅ <strong>System Ready</strong><br>
                    📍 Chrome Path: ${result.chromePath || 'Default'}<br>
                    💡 Message: ${result.message}<br>
                    🔒 PROXY: WAJIB DIGUNAKAN<br>
                    <small>System akan SELALU menggunakan proxy</small>
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

function goToMonitoring() {
    window.location.href = '/monitoring';
}

function clearSessions() {
    if (confirm('Are you sure you want to stop ALL sessions and clear logs?')) {
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
[file content end]