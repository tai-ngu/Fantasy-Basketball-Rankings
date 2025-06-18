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
        await checkBackend();
        
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

function displayPlayers(players, searchTerm = '') {
    const playerListEl = document.getElementById('player-list');
    
    if (!players || players.length === 0) {
        playerListEl.innerHTML = '<p>No players found</p>';
        return;
    }
    
    // Filter players based on search term
    let filteredPlayers = players;
    if (searchTerm) {
        filteredPlayers = players.filter(player => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Sort alphabetically by name
    filteredPlayers.sort((a, b) => a.name.localeCompare(b.name));
    
    if (filteredPlayers.length === 0) {
        playerListEl.innerHTML = `<p>No players found matching "${searchTerm}"</p>`;
        return;
    }
    
    playerListEl.innerHTML = `
        <div style="margin-bottom: 15px; color: #666;">
            Showing ${filteredPlayers.length} of ${players.length} players
        </div>
        ${filteredPlayers.map(player => `
            <div class="player-card">
                <div class="player-name">${player.name}</div>
                <div class="player-stats">
                    <div>Team: ${player.team}</div>
                    <div>Games: ${player.games_played}</div>
                    <div>PPG: ${player.points && player.games_played ? (player.points / player.games_played).toFixed(1) : 'N/A'}</div>
                    <div>RPG: ${player.rebounds && player.games_played ? (player.rebounds / player.games_played).toFixed(1) : 'N/A'}</div>
                    <div>APG: ${player.assists && player.games_played ? (player.assists / player.games_played).toFixed(1) : 'N/A'}</div>
                    <div>FG%: ${player.fg_pct ? (player.fg_pct * 100).toFixed(1) + '%' : 'N/A'}</div>
                </div>
            </div>
        `).join('')}
    `;
}
// Main function to fetch and display players
async function fetchAndDisplayPlayers() {
    try {
        const players = await fetchPlayerData();
        displayPlayers(players);
        
        // Show search section and enable draft button
        document.getElementById('search-section').style.display = 'block';
        document.getElementById('run-draft').disabled = false;
        
        // Add search functionality
        const searchInput = document.getElementById('player-search');
        searchInput.addEventListener('input', function() {
            displayPlayers(players, this.value);
        });
        
    } catch (error) {
        console.error('Failed to fetch and display players:', error);
    }
}