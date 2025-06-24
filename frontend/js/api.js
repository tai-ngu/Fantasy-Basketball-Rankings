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
            const mockDraftSeason = data.season_info.mock_draft_season;
            document.title = `NBA Fantasy Basketball Rankings ${mockDraftSeason}`;
            const h1Element = document.querySelector('h1');
            if (h1Element) {
                h1Element.textContent = `NBA Fantasy Basketball Rankings ${mockDraftSeason}`;
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
    updateStatus('Fetching player data from NBA API...', 'loading');
    
    try {
        // Check if backend is running
        await checkBackend();
        
        const response = await fetch(`${API_BASE_URL}/players`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch player data');
        }
        
        const data = await response.json();
        playersData = data.players;
        
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

// FUTURE FEATURE: Fetch comparison data between current and last season
// This function is ready for a dedicated comparison tool/page
async function fetchSeasonComparison() {
    updateStatus('Fetching season comparison data...', 'loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/players/comparison`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch comparison data');
        }
        
        const data = await response.json();
        
        // Hide the status message completely after successful load
        const statusEl = document.getElementById('status');
        statusEl.style.display = 'none';
        
        return data;
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        throw error;
    }
}