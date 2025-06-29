// API Configuration - Auto-detect local vs production
const API_BASE_URL = (function() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Local development detection
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '' ||
        port === '8000' || 
        port === '3000' ||
        port === '5500') {
        return 'http://localhost:5000/api';
    }
    
    // Production (Railway) detection
    return window.location.origin + '/api';
})();

let playersData = [];

// Update status message
function updateStatus(message, type = 'loading') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    
    // Auto-hide success messages after 4 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            statusEl.style.opacity = '0';
            statusEl.style.transform = 'translateY(-10px)';
            
            // Hide completely after transition
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 500);
        }, 3300);
    } else {
        // Reset styles for non-success messages
        statusEl.style.display = 'block';
        statusEl.style.opacity = '1';
        statusEl.style.transform = 'translateY(0)';
        statusEl.style.transition = '';
    }
}

// Check if backend is running and get season info
async function checkBackend() {
   try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        // Update page title and header with dynamic season info
        if (data.season_info) {
            const currentSeason = data.season_info.current_season;
            document.title = `StatLine Fantasy`;
            
            // Update the season subtitle in the header
            const seasonSubtitle = document.getElementById('season-subtitle');
            if (seasonSubtitle) {
                seasonSubtitle.textContent = `(${currentSeason})`;
            }
        }
        
        // Update season button labels with actual season numbers
        if (data.season_info && data.last_season_info) {
            const currentSeason = data.season_info.stats_season;
            const lastSeason = data.last_season_info.stats_season;
            
            const currentSeasonBtn = document.getElementById('current-season-btn');
            const lastSeasonBtn = document.getElementById('last-season-btn');
            
            if (currentSeasonBtn && lastSeasonBtn) {
                currentSeasonBtn.textContent = `Current Season (${currentSeason})`;
                lastSeasonBtn.textContent = `Previous Season (${lastSeason})`;
            }
        }
        
        return data;
    } catch (error) {
        throw new Error('Backend server not running. Start it with: python3 backend/app.py');
    }
}

// Fetch player data from backend
async function fetchPlayerData() {
    const startTime = performance.now();
    console.log('⏱️ Starting to fetch player data...');
    updateStatus('Fetching player data from NBA API...', 'loading');
    
    try {
        const fetchStart = performance.now();
        const response = await fetch(`${API_BASE_URL}/players`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch player data');
        }
        
        const data = await response.json();
        playersData = data.players;
        
        // Update season info from the API response
        if (data.current_season) {
            const seasonSubtitle = document.getElementById('season-subtitle');
            if (seasonSubtitle) {
                seasonSubtitle.textContent = `(${data.current_season})`;
            }
        }
        
        const fetchEnd = performance.now();
        const totalTime = (fetchEnd - startTime) / 1000;
        const apiTime = (fetchEnd - fetchStart) / 1000;
        
        // Determine if this was likely from cache based on response time
        const fromCache = apiTime < 0.5; // Less than 500ms likely means cache hit
        
        if (fromCache) {
            console.log(`✅ Player data loaded from cache!`);
            console.log(`📦 Cache load time: ${totalTime.toFixed(3)}s`);
        } else {
            console.log(`✅ Fresh player data loaded from NBA API!`);
            console.log(`🔄 Fresh data load time: ${totalTime.toFixed(3)}s`);
        }
        console.log(`🌐 API request time: ${apiTime.toFixed(3)}s`);
        console.log(`👥 Players loaded: ${playersData.length}`);
        
        // Hide the status message completely after successful load
        const statusEl = document.getElementById('status');
        statusEl.style.display = 'none';
        
        return playersData;
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// Fetch last season player data from backend
async function fetchLastSeasonPlayerData() {
    updateStatus('Fetching last season player data...', 'loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/players/last-season`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch last season data');
        }
        
        const data = await response.json();
        
        // Hide the status message completely after successful load
        const statusEl = document.getElementById('status');
        statusEl.style.display = 'none';
        
        return data.players;
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        throw error;
    }
}

