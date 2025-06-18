// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

let playersData = [];

// Update status message
function updateStatus(message, type = 'loading') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Check if backend is running and get season info
async function checkBackend() {
   try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        // Update page title and header with dynamic season info
        if (data.season_info) {
            const mockDraftSeason = data.season_info.mock_draft_season;
            document.title = `Fantasy Basketball Mock Draft ${mockDraftSeason}`;
            const h1Element = document.querySelector('h1');
            if (h1Element) {
                h1Element.textContent = `Fantasy Basketball Mock Draft ${mockDraftSeason}`;
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
        
        updateStatus(`Successfully loaded ${data.total_count} players. ${data.description}`, 'success');
        return playersData;
        
    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
        throw error;
    }
}

let currentSortBy = 'fantasy'; // Default sort by fantasy value

function displayPlayers(players, searchTerm = '', teamFilter = 'all', sortBy = currentSortBy) {
    const playerListEl = document.getElementById('player-list');
    
    if (!players || players.length === 0) {
        playerListEl.innerHTML = '<p>No players found</p>';
        return;
    }
    
    // Filter players based on search term and team
    let filteredPlayers = players;
    if (searchTerm) {
        filteredPlayers = filteredPlayers.filter(player => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    if (teamFilter && teamFilter !== 'all') {
        filteredPlayers = filteredPlayers.filter(player => 
            player.team === teamFilter
        );
    }
    
    // Sort players based on selected criteria
    switch(sortBy) {
        case 'fantasy':
            filteredPlayers.sort((a, b) => (b.fantasyValue || 0) - (a.fantasyValue || 0));
            break;
        case 'name':
            filteredPlayers.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'ppg':
            filteredPlayers.sort((a, b) => {
                const aPPG = a.points && a.games_played ? a.points / a.games_played : 0;
                const bPPG = b.points && b.games_played ? b.points / b.games_played : 0;
                return bPPG - aPPG;
            });
            break;
        case 'team':
            filteredPlayers.sort((a, b) => a.team.localeCompare(b.team));
            break;
        default:
            filteredPlayers.sort((a, b) => (b.fantasyValue || 0) - (a.fantasyValue || 0));
    }
    
    if (filteredPlayers.length === 0) {
        const searchMessage = searchTerm ? ` matching "${searchTerm}"` : '';
        const teamMessage = teamFilter && teamFilter !== 'all' ? ` on ${teamFilter}` : '';
        playerListEl.innerHTML = `<p>No players found${searchMessage}${teamMessage}</p>`;
        return;
    }
    
    playerListEl.innerHTML = `
        <div style="margin-bottom: 15px; color: #666;">
            Showing ${filteredPlayers.length} of ${players.length} players
        </div>
        ${filteredPlayers.map(player => `
            <div class="player-card" style="display: flex; gap: 15px; align-items: center;">
                <img src="https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.player_id}.png" 
                     alt="${player.name}" 
                     style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"
                     onerror="this.src='https://via.placeholder.com/80x80/ccc/666?text=No+Photo'">
                <div style="flex: 1;">
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">
                        <div>Team: ${player.team}</div>
                        <div>Games: ${player.games_played}</div>
                        <div style="color: #ff6b35; font-weight: bold;">Fantasy Value: ${player.fantasyValue ? player.fantasyValue.toFixed(1) : 'N/A'}</div>
                        <div>PPG: ${player.points && player.games_played ? (player.points / player.games_played).toFixed(1) : 'N/A'}</div>
                        <div>RPG: ${player.rebounds && player.games_played ? (player.rebounds / player.games_played).toFixed(1) : 'N/A'}</div>
                        <div>APG: ${player.assists && player.games_played ? (player.assists / player.games_played).toFixed(1) : 'N/A'}</div>
                        <div>FG%: ${player.fg_pct ? (player.fg_pct * 100).toFixed(1) + '%' : 'N/A'}</div>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// Populate team dropdown with unique teams
function populateTeamDropdown(players) {
    const teamSelect = document.getElementById('team-filter');
    const uniqueTeams = [...new Set(players.map(player => player.team))].sort();
    
    // Clear existing options except "All Teams"
    teamSelect.innerHTML = '<option value="all">All Teams</option>';
    
    // Add team options
    uniqueTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });
}
// Main function to fetch and display players
async function fetchAndDisplayPlayers() {
    try {
        const players = await fetchPlayerData();
        
        // Calculate fantasy values for ALL players
        const playersWithFantasyValues = players.map(player => ({
            ...player,
            fantasyValue: draftAlgorithm.calculateFantasyValue(player)
        }));
        
        // Update the global playersData with fantasy values
        playersData = playersWithFantasyValues;
        window.playersData = playersWithFantasyValues;
        
        displayPlayers(playersWithFantasyValues);
        
        // Populate team dropdown
        populateTeamDropdown(playersWithFantasyValues);
        
        // Show search section and enable draft button
        document.getElementById('search-section').style.display = 'block';
        document.getElementById('run-draft').disabled = false;
        
        // Add search and filter functionality
        const searchInput = document.getElementById('player-search');
        const teamFilter = document.getElementById('team-filter');
        
        function updatePlayerDisplay() {
            displayPlayers(playersWithFantasyValues, searchInput.value, teamFilter.value, currentSortBy);
        }
        
        searchInput.addEventListener('input', updatePlayerDisplay);
        teamFilter.addEventListener('change', updatePlayerDisplay);
        
        // Add sorting functionality
        document.getElementById('sort-fantasy').addEventListener('click', function() {
            currentSortBy = 'fantasy';
            updatePlayerDisplay();
        });
        
        document.getElementById('sort-name').addEventListener('click', function() {
            currentSortBy = 'name';
            updatePlayerDisplay();
        });
        
        document.getElementById('sort-ppg').addEventListener('click', function() {
            currentSortBy = 'ppg';
            updatePlayerDisplay();
        });
        
        document.getElementById('sort-team').addEventListener('click', function() {
            currentSortBy = 'team';
            updatePlayerDisplay();
        });
        
    } catch (error) {
        console.error('Failed to fetch and display players:', error);
    }
}