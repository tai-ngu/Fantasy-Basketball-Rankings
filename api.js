// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

let playersData = [];

// Update status message
function updateStatus(message, type = 'loading') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Check if backend is running
async function checkBackend() {
   try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
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
        await checkBackendHealth();
        
        const response = await fetch(`${API_BASE_URL}/players/2024-25`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch player data');
        }
        
        const data = await response.json();
        playersData = data.players;
        
        updateStatus(`Successfully loaded ${data.total_count} players from ${data.season} season`, 'success');
        return playersData;
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        throw error;
    }
}

function displayPlayers(players) {
    const playerListEl = document.getElementById('player-list');
    
    if (!players || players.length === 0) {
        playerListEl.innerHTML = '<p>No players found</p>';
        return;
    }
    
    playerListEl.innerHTML = players.slice(0, 50).map((player, index) => `
        <div class="player-card">
            <div class="player-rank">Rank: ${index + 1}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-stats">
                <div>Team: ${player.team}</div>
                <div>Games: ${player.games_played}</div>
                <div>PPG: ${player.points?.toFixed(1) || 'N/A'}</div>
                <div>RPG: ${player.rebounds?.toFixed(1) || 'N/A'}</div>
                <div>APG: ${player.assists?.toFixed(1) || 'N/A'}</div>
                <div>FG%: ${player.fg_pct ? (player.fg_pct * 100).toFixed(1) + '%' : 'N/A'}</div>
            </div>
        </div>
    `).join('');
}
// Main function to fetch and display players
async function fetchAndDisplayPlayers() {
    try {
        const players = await fetchPlayerData();
        displayPlayers(players);
        
        // Enable draft button
        document.getElementById('run-draft').disabled = false;
        
    } catch (error) {
        console.error('Failed to fetch and display players:', error);
    }
}
