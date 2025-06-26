// UI and Display Logic for Fantasy Basketball Rankings

// Global variables for sorting state (accessible from main.js)
window.currentSortBy = 'fantasy'; // Default sort by fantasy value
window.sortDirection = 'desc'; // 'desc' for high to low, 'asc' for low to high

// Local references for this file
let currentSortBy = window.currentSortBy;
let sortDirection = window.sortDirection;

function displayPlayers(players, searchTerm = '', teamFilter = 'all', positionFilter = 'all', injuryFilter = 'all', sortBy = window.currentSortBy) {
    // Sync local variables with global ones
    currentSortBy = window.currentSortBy;
    sortDirection = window.sortDirection;
    const playerListEl = document.getElementById('player-list');
    
    if (!players || players.length === 0) {
        playerListEl.innerHTML = '<p>No players found</p>';
        return;
    }
    
    // Filter players based on search term, team, and position
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
    if (positionFilter && positionFilter !== 'all') {
        filteredPlayers = filteredPlayers.filter(player => {
            const playerPosition = player.position;
            if (!playerPosition) return positionFilter === 'unknown';
            
            // Map position abbreviations to filter categories
            const pos = playerPosition.toUpperCase();
            switch(positionFilter) {
                case 'G': return pos.includes('G'); // PG, SG, G
                case 'F': return pos.includes('F'); // SF, PF, F
                case 'C': return pos.includes('C'); // C
                case 'unknown': return !playerPosition;
                default: return pos === positionFilter;
            }
        });
    }
    if (injuryFilter && injuryFilter !== 'all') {
        filteredPlayers = filteredPlayers.filter(player => {
            const injuryStatus = player.injury_status;
            if (injuryFilter === 'healthy') {
                // Healthy: no injury status or status is "Healthy"
                return !injuryStatus || injuryStatus === 'Healthy';
            } else if (injuryFilter === 'injured') {
                // Injured: has injury status and it's not "Healthy"
                return injuryStatus && injuryStatus !== 'Healthy';
            }
            return true;
        });
    }
    
    // Apply minimum games filter for stat-based sorting
    const statSortingOptions = ['ppg', 'rpg', 'apg', 'spg', 'bpg', 'tpg', 'fg_pct', 'fg3_pct', 'ft_pct', 'ts_pct', 'mpg'];
    if (statSortingOptions.includes(sortBy)) {
        filteredPlayers = filteredPlayers.filter(player => player.games_played >= 10);
    }
    
    // Sort players based on selected criteria
    switch(sortBy) {
        case 'fantasy':
            filteredPlayers.sort((a, b) => {
                const aVal = a.fantasyValue || 0;
                const bVal = b.fantasyValue || 0;
                return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
            });
            break;
        case 'name':
            filteredPlayers.sort((a, b) => {
                return sortDirection === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
            });
            break;
        case 'ppg':
            filteredPlayers.sort((a, b) => {
                const aPPG = a.points && a.games_played ? a.points / a.games_played : 0;
                const bPPG = b.points && b.games_played ? b.points / b.games_played : 0;
                return sortDirection === 'desc' ? bPPG - aPPG : aPPG - bPPG;
            });
            break;
        case 'rpg':
            filteredPlayers.sort((a, b) => {
                const aRPG = a.rebounds && a.games_played ? a.rebounds / a.games_played : 0;
                const bRPG = b.rebounds && b.games_played ? b.rebounds / b.games_played : 0;
                return sortDirection === 'desc' ? bRPG - aRPG : aRPG - bRPG;
            });
            break;
        case 'apg':
            filteredPlayers.sort((a, b) => {
                const aAPG = a.assists && a.games_played ? a.assists / a.games_played : 0;
                const bAPG = b.assists && b.games_played ? b.assists / b.games_played : 0;
                return sortDirection === 'desc' ? bAPG - aAPG : aAPG - bAPG;
            });
            break;
        case 'spg':
            filteredPlayers.sort((a, b) => {
                const aSPG = a.steals && a.games_played ? a.steals / a.games_played : 0;
                const bSPG = b.steals && b.games_played ? b.steals / b.games_played : 0;
                return sortDirection === 'desc' ? bSPG - aSPG : aSPG - bSPG;
            });
            break;
        case 'bpg':
            filteredPlayers.sort((a, b) => {
                const aBPG = a.blocks && a.games_played ? a.blocks / a.games_played : 0;
                const bBPG = b.blocks && b.games_played ? b.blocks / b.games_played : 0;
                return sortDirection === 'desc' ? bBPG - aBPG : aBPG - bBPG;
            });
            break;
        case 'tpg':
            filteredPlayers.sort((a, b) => {
                const aTPG = a.turnovers && a.games_played ? a.turnovers / a.games_played : 0;
                const bTPG = b.turnovers && b.games_played ? b.turnovers / b.games_played : 0;
                // For turnovers, reverse the logic: desc means low to high (better), asc means high to low (worse)
                return sortDirection === 'desc' ? aTPG - bTPG : bTPG - aTPG;
            });
            break;
        case 'fg_pct':
            filteredPlayers.sort((a, b) => {
                const aFG = a.fg_pct || 0;
                const bFG = b.fg_pct || 0;
                return sortDirection === 'desc' ? bFG - aFG : aFG - bFG;
            });
            break;
        case 'fg3_pct':
            filteredPlayers.sort((a, b) => {
                const a3P = a.fg3_pct || 0;
                const b3P = b.fg3_pct || 0;
                return sortDirection === 'desc' ? b3P - a3P : a3P - b3P;
            });
            break;
        case 'ft_pct':
            filteredPlayers.sort((a, b) => {
                const aFT = a.ft_pct || 0;
                const bFT = b.ft_pct || 0;
                return sortDirection === 'desc' ? bFT - aFT : aFT - bFT;
            });
            break;
        case 'ts_pct':
            filteredPlayers.sort((a, b) => {
                const aTS = calculateTrueShootingPct(a);
                const bTS = calculateTrueShootingPct(b);
                return sortDirection === 'desc' ? bTS - aTS : aTS - bTS;
            });
            break;
        case 'mpg':
            filteredPlayers.sort((a, b) => {
                const aMPG = a.minutes && a.games_played ? a.minutes / a.games_played : 0;
                const bMPG = b.minutes && b.games_played ? b.minutes / b.games_played : 0;
                return sortDirection === 'desc' ? bMPG - aMPG : aMPG - bMPG;
            });
            break;
        case 'team':
            filteredPlayers.sort((a, b) => {
                return sortDirection === 'desc' ? b.team.localeCompare(a.team) : a.team.localeCompare(b.team);
            });
            break;
        default:
            filteredPlayers.sort((a, b) => {
                const aVal = a.fantasyValue || 0;
                const bVal = b.fantasyValue || 0;
                return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
            });
    }
    
    if (filteredPlayers.length === 0) {
        const searchMessage = searchTerm ? ` matching "${searchTerm}"` : '';
        const teamMessage = teamFilter && teamFilter !== 'all' ? ` on ${teamFilter}` : '';
        const positionMessage = positionFilter && positionFilter !== 'all' ? ` at ${positionFilter}` : '';
        const injuryMessage = injuryFilter && injuryFilter !== 'all' ? ` (${injuryFilter} only)` : '';
        playerListEl.innerHTML = `<p>No players found${searchMessage}${teamMessage}${positionMessage}${injuryMessage}</p>`;
        return;
    }
    
    // Remove any existing count info
    const existingCountInfo = playerListEl.parentElement.querySelector('.player-count-info');
    if (existingCountInfo) {
        existingCountInfo.remove();
    }
    
    // Add the count info before the grid
    const countInfo = document.createElement('div');
    countInfo.className = 'player-count-info';
    countInfo.textContent = `Showing ${filteredPlayers.length} of ${players.length} players`;
    playerListEl.parentElement.insertBefore(countInfo, playerListEl);
    
    // Calculate fantasy rankings for all players (sorted by fantasy value)
    const allPlayersSorted = [...players].sort((a, b) => (b.fantasyValue || 0) - (a.fantasyValue || 0));
    const fantasyRankings = new Map();
    allPlayersSorted.forEach((player, index) => {
        fantasyRankings.set(player.player_id, index + 1);
    });


    // Create and set player cards
    playerListEl.innerHTML = filteredPlayers.map((player, index) => {
        const fantasyRank = fantasyRankings.get(player.player_id);
        
        let rankingChange = '';
        
        // Determine which stat to show and calculate values
        const ppg = player.points && player.games_played ? (player.points / player.games_played).toFixed(1) : 'N/A';
        const rpg = player.rebounds && player.games_played ? (player.rebounds / player.games_played).toFixed(1) : 'N/A';
        const apg = player.assists && player.games_played ? (player.assists / player.games_played).toFixed(1) : 'N/A';
        
        // Get team logo image
        const getTeamLogo = (team) => {
            return `<img src="https://cdn.nba.com/logos/nba/${getTeamId(team)}/global/L/logo.svg" alt="${team}" class="team-logo" onerror="this.style.display='none'">`;
        };

        // Get NBA team ID for logo URLs
        const getTeamId = (team) => {
            const teamIds = {
                'ATL': '1610612737', 'BOS': '1610612738', 'BKN': '1610612751', 'CHA': '1610612766', 
                'CHI': '1610612741', 'CLE': '1610612739', 'DAL': '1610612742', 'DEN': '1610612743',
                'DET': '1610612765', 'GSW': '1610612744', 'HOU': '1610612745', 'IND': '1610612754',
                'LAC': '1610612746', 'LAL': '1610612747', 'MEM': '1610612763', 'MIA': '1610612748',
                'MIL': '1610612749', 'MIN': '1610612750', 'NOP': '1610612740', 'NYK': '1610612752',
                'OKC': '1610612760', 'ORL': '1610612753', 'PHI': '1610612755', 'PHX': '1610612756',
                'POR': '1610612757', 'SAC': '1610612758', 'SAS': '1610612759', 'TOR': '1610612761',
                'UTA': '1610612762', 'WAS': '1610612764'
            };
            return teamIds[team] || '1610612737';
        };

        // Get injury status and icon with timeline
        const getInjuryDisplay = (status, type, timeline) => {
            if (!status || status === 'Healthy') return '';
            
            let displayText = '';
            
            // Add injury type or "Injured" if no type
            if (type) {
                let mainType = type.split('(')[0].trim();
                displayText += `Injured (${mainType})`;
            } else {
                displayText += 'Injured';
            }
            
            // Add return date on new line if available
            if (timeline && timeline !== 'None' && timeline !== '') {
                displayText += `<br>Est. Return: ${timeline}`;
            }
            
            return `<div class="injury-status">${displayText}</div>`;
        };
        
        const injuryDisplay = getInjuryDisplay(player.injury_status, player.injury_type, player.injury_timeline);
        
        let ptsDisplay = `PTS: ${ppg}`;
        let rebDisplay = `REB: ${rpg}`;
        let astDisplay = `AST: ${apg}`;
        let stlDisplay = `STL: ${player.steals && player.games_played ? (player.steals / player.games_played).toFixed(1) : 'N/A'}`;
        let blkDisplay = `BLK: ${player.blocks && player.games_played ? (player.blocks / player.games_played).toFixed(1) : 'N/A'}`;
        let tovDisplay = `TOV: ${player.turnovers && player.games_played ? (player.turnovers / player.games_played).toFixed(1) : 'N/A'}`;
        let extraStatDisplay = '';
        
        // Handle sorting by stats - make the sorted stat bold in its normal position
        switch(sortBy) {
            case 'ppg':
                ptsDisplay = `<strong>PTS: ${ppg}</strong>`;
                break;
            case 'rpg':
                rebDisplay = `<strong>REB: ${rpg}</strong>`;
                break;
            case 'apg':
                astDisplay = `<strong>AST: ${apg}</strong>`;
                break;
            case 'spg':
                stlDisplay = `<strong>STL: ${player.steals && player.games_played ? (player.steals / player.games_played).toFixed(1) : 'N/A'}</strong>`;
                break;
            case 'bpg':
                blkDisplay = `<strong>BLK: ${player.blocks && player.games_played ? (player.blocks / player.games_played).toFixed(1) : 'N/A'}</strong>`;
                break;
            case 'tpg':
                tovDisplay = `<strong>TOV: ${player.turnovers && player.games_played ? (player.turnovers / player.games_played).toFixed(1) : 'N/A'}</strong>`;
                break;
            case 'fg_pct':
                // FG% will be made bold in the bottom row
                break;
            case 'fg3_pct':
                extraStatDisplay = `<strong>3P%: ${player.fg3_pct ? (player.fg3_pct * 100).toFixed(1) + '%' : 'N/A'}</strong>`;
                break;
            case 'ft_pct':
                // FT% will be made bold in the bottom row
                break;
            case 'ts_pct':
                extraStatDisplay = `<strong>TS%: ${calculateTrueShootingPct(player).toFixed(1) + '%'}</strong>`;
                break;
            case 'mpg':
                // MIN is already shown in the games line
                break;
            default:
                break;
        }
        
        // Check if player is injured
        const isInjured = player.injury_status && player.injury_status !== 'Healthy';
        
        return `
        <div class="player-card ${isInjured ? 'injured' : ''}" data-player-index="${index}">
            ${isInjured ? `<div class="injury-badge">INJURED</div>` : ''}
            <div class="team-logo-corner">${getTeamLogo(player.team)}</div>
            <div class="player-rank">#${fantasyRank}</div>
            ${rankingChange}
            <div class="player-card-content">
                <div class="player-photo-section">
                    <img src="https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.player_id}.png" 
                         alt="${player.name}" 
                         class="player-photo"
                         onerror="this.style.display='none'">
                    ${injuryDisplay ? `<div class="player-injury-status-below">${injuryDisplay.replace('<div class="injury-status">', '').replace('</div>', '')}</div>` : ''}
                </div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="fantasy-value">Fantasy Value: ${player.fantasyValue ? player.fantasyValue.toFixed(1) : 'N/A'}</div>
                    <div class="player-stats">
                        <div>Team: ${player.team}${player.position ? ` | Position: ${player.position}` : ''}</div>
                        <div class="games-mpg-line">GP: ${player.games_played} | MIN: ${player.minutes && player.games_played ? (player.minutes / player.games_played).toFixed(1) : 'N/A'}</div>
                        <div class="stats-row">
                            <span>${ptsDisplay}</span>
                            <span>${stlDisplay}</span>
                        </div>
                        <div class="stats-row">
                            <span>${rebDisplay}</span>
                            <span>${blkDisplay}</span>
                        </div>
                        <div class="stats-row">
                            <span>${astDisplay}</span>
                            <span>${tovDisplay}</span>
                        </div>
                        <div class="stats-row">
                            <span>${sortBy === 'fg_pct' ? `<strong>FG%: ${player.fg_pct ? (player.fg_pct * 100).toFixed(1) + '%' : 'N/A'}</strong>` : `FG%: ${player.fg_pct ? (player.fg_pct * 100).toFixed(1) + '%' : 'N/A'}`}</span>
                            <span>${sortBy === 'ft_pct' ? `<strong>FT%: ${player.ft_pct ? (player.ft_pct * 100).toFixed(1) + '%' : 'N/A'}</strong>` : `FT%: ${player.ft_pct ? (player.ft_pct * 100).toFixed(1) + '%' : 'N/A'}`}</span>
                        </div>
                        ${extraStatDisplay ? `<div class="extra-stat-line">${extraStatDisplay}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Add click event listeners to player cards
    addPlayerCardClickHandlers(filteredPlayers);
}

// Populate team dropdown with unique teams
function populateTeamDropdown(players) {
    const teamDropdownMenu = document.getElementById('team-dropdown-menu');
    const uniqueTeams = [...new Set(players.map(player => player.team))].sort();
    
    // Clear existing items except "All Teams"
    teamDropdownMenu.innerHTML = '<div class="dropdown-item" data-team="all">All Teams</div>';
    
    // Add team options
    uniqueTeams.forEach(team => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.setAttribute('data-team', team);
        item.textContent = team;
        teamDropdownMenu.appendChild(item);
    });
}


// Calculate True Shooting Percentage using Dean Oliver's formula
function calculateTrueShootingPct(player) {
    const gamesPlayed = player.games_played || 1;
    const pointsPerGame = (player.points || 0) / gamesPlayed;
    
    // Calculate FGA and FTA from existing data
    const fgmPerGame = (player.fgm || 0) / gamesPlayed;
    const ftmPerGame = (player.ftm || 0) / gamesPlayed;
    
    const fgaPerGame = player.fg_pct && player.fg_pct > 0 ? fgmPerGame / player.fg_pct : 0;
    const ftaPerGame = player.ft_pct && player.ft_pct > 0 ? ftmPerGame / player.ft_pct : 0;
    
    if (fgaPerGame === 0 && ftaPerGame === 0) return 0;
    
    // True Shooting % = PTS / (2 * (FGA + 0.44 * FTA)) * 100
    return (pointsPerGame / (2 * (fgaPerGame + 0.44 * ftaPerGame))) * 100;
}

// Setup position dropdown functionality
function setupPositionDropdown(updateCallback) {
    const dropdownBtn = document.getElementById('position-filter-btn');
    const dropdownMenu = document.getElementById('position-dropdown-menu');
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Handle dropdown item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const position = item.getAttribute('data-position');
            const text = item.textContent;
            
            // Update button text
            dropdownBtn.textContent = text + ' ▼';
            
            // Hide dropdown and call update callback with new position filter
            dropdownMenu.classList.remove('show');
            updateCallback(position);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
}

// Setup injury dropdown functionality
function setupInjuryDropdown(updateCallback) {
    const dropdownBtn = document.getElementById('injury-filter-btn');
    const dropdownMenu = document.getElementById('injury-dropdown-menu');
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Handle dropdown item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const injury = item.getAttribute('data-injury');
            const text = item.textContent;
            
            // Update button text
            dropdownBtn.textContent = text + ' ▼';
            
            // Hide dropdown and call update callback with new injury filter
            dropdownMenu.classList.remove('show');
            updateCallback(injury);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
}

// Setup team dropdown functionality
function setupTeamDropdown(updateCallback) {
    const dropdownBtn = document.getElementById('team-filter-btn');
    const dropdownMenu = document.getElementById('team-dropdown-menu');
    
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Handle dropdown item selection using event delegation
    dropdownMenu.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item')) {
            e.stopPropagation();
            const team = e.target.getAttribute('data-team');
            const text = e.target.textContent;
            
            // Update button text
            dropdownBtn.textContent = text + ' ▼';
            
            // Hide dropdown and call update callback with new team
            dropdownMenu.classList.remove('show');
            updateCallback(team);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
}

// Setup stat dropdown functionality
function setupStatDropdown(updateCallback) {
    const dropdownBtn = document.getElementById('stat-filter-btn');
    const dropdownMenu = document.getElementById('stat-dropdown-menu');
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    
    // Toggle dropdown on button click
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Handle dropdown item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const stat = item.getAttribute('data-stat');
            const text = item.textContent;
            
            // Update button text
            dropdownBtn.textContent = text + ' ▼';
            
            // Hide dropdown and call update callback with new stat
            dropdownMenu.classList.remove('show');
            updateCallback(stat);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
}

// Setup sort direction button functionality
function setupSortDirectionButton(updateCallback) {
    const directionBtn = document.getElementById('sort-direction-btn');
    
    directionBtn.addEventListener('click', () => {
        // Toggle sort direction
        sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        window.sortDirection = sortDirection; // Update global reference
        updateSortDirectionButton();
        updateCallback();
    });
}

// Update sort direction button text and visibility
function updateSortDirectionButton() {
    const directionBtn = document.getElementById('sort-direction-btn');
    
    // Show custom sort icons based on direction
    if (sortDirection === 'desc') {
        // Descending: lines getting shorter with down arrow
        directionBtn.innerHTML = '≡↓';
    } else {
        // Ascending: lines getting shorter with up arrow  
        directionBtn.innerHTML = '≡↑';
    }
}

// Add click event handlers to player cards
function addPlayerCardClickHandlers(players) {
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const player = players[index];
            
            // Small delay to allow the :active transition to be visible
            setTimeout(() => {
                showPlayerModal(player);
            }, 100);
        });
    });
}

// Show player details modal
function showPlayerModal(player) {
    const modal = document.getElementById('playerModal');
    const modalContent = document.getElementById('playerModalContent');
    const template = document.getElementById('playerModalTemplate');
    
    // Clone the template
    const clone = template.content.cloneNode(true);
    
    // Get detailed fantasy breakdown
    const breakdown = fantasyAlgorithm.getFantasyBreakdown(player);
    
    // Show modal immediately with placeholder data
    populatePlayerModalTemplate(clone, player, breakdown);
    modalContent.innerHTML = '';
    modalContent.appendChild(clone);
    modal.style.display = 'block';
    
    // No additional data fetching needed - all data from main API
    
    // Add close functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';
    
    // Close when clicking outside modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Populate modal template with player data
function populatePlayerModalTemplate(clone, player, breakdown) {
    // Helper function to safely set text content
    const setText = (selector, value) => {
        const element = clone.querySelector(selector);
        if (element) element.textContent = value;
    };
    
    // Helper function for percentage values
    const formatPercentage = (value) => value ? (value * 100).toFixed(1) + '%' : 'N/A';
    
    // Set player photo
    const photo = clone.querySelector('.player-modal-photo');
    photo.src = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.player_id}.png`;
    photo.alt = player.name;
    
    // Data mapping for efficient population
    const dataMap = {
        // Basic info
        '.player-name': player.name,
        '.player-team': player.team,
        '.player-position': player.position || 'N/A',
        '.player-age': player.age || 'N/A',
        '.player-height': player.height || 'N/A',
        '.player-weight': player.weight || 'N/A',
        '.player-jersey': player.jersey || 'N/A',
        '.player-games': player.games_played,
        
        // Personal info details
        '.player-age-detail': player.age || 'N/A',
        '.player-height-detail': player.height || 'N/A',
        '.player-weight-detail': player.weight || 'N/A',
        '.player-position-detail': player.position || 'N/A',
        '.player-jersey-detail': player.jersey ? `#${player.jersey}` : 'N/A',
        '.player-team-detail': player.team || 'N/A',
        '.player-birthdate': player.birthdate || 'N/A',
        '.player-birthplace': player.birthplace || 'N/A',
        '.player-college': player.college || 'N/A',
        
        // Scoring stats (per game)
        '.stat-ppg': (player.points / player.games_played).toFixed(1),
        '.stat-fgm': (player.fgm / player.games_played).toFixed(1),
        '.stat-fg3m': breakdown.perGameStats.fg3m.toFixed(1),
        '.stat-fg2m': breakdown.perGameStats.fg2m.toFixed(1),
        '.stat-ftm': breakdown.perGameStats.ftm.toFixed(1),
        
        // Shooting percentages
        '.stat-fg-pct': formatPercentage(player.fg_pct),
        '.stat-fg3-pct': formatPercentage(player.fg3_pct),
        '.stat-ft-pct': formatPercentage(player.ft_pct),
        '.stat-ts-pct': calculateTrueShootingPct(player).toFixed(1) + '%',
        
        // Other stats (per game)
        '.stat-rebounds': breakdown.perGameStats.rebounds.toFixed(1),
        '.stat-assists': breakdown.perGameStats.assists.toFixed(1),
        '.stat-steals': breakdown.perGameStats.steals.toFixed(1),
        '.stat-blocks': breakdown.perGameStats.blocks.toFixed(1),
        '.stat-turnovers': breakdown.perGameStats.turnovers.toFixed(1),
        
        // Season totals
        '.stat-total-points': player.points || 0,
        '.stat-total-rebounds': player.rebounds || 0,
        '.stat-total-assists': player.assists || 0,
        '.stat-total-minutes': Math.round(player.minutes || 0),
        
        // Fantasy breakdown
        '.base-score': breakdown.baseScore.toFixed(2),
        '.games-multiplier': breakdown.multipliers.gamesPlayed.toFixed(3),
        '.age-multiplier': breakdown.multipliers.age.toFixed(3),
        '.games-played': player.games_played,
        '.player-age-breakdown': player.age || 'N/A',
        '.final-calculation': `${breakdown.baseScore.toFixed(2)} × ${breakdown.multipliers.gamesPlayed.toFixed(3)} × ${breakdown.multipliers.age.toFixed(3)} = ${breakdown.finalScore.toFixed(2)}`,
        '.final-fantasy-value': breakdown.finalScore.toFixed(1)
    };
    
    // Apply all data mappings
    Object.entries(dataMap).forEach(([selector, value]) => setText(selector, value));
    
    // Handle calculation steps (requires DOM creation)
    const stepsContainer = clone.querySelector('.calculation-steps');
    breakdown.steps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'calculation-step';
        stepDiv.textContent = step;
        stepsContainer.appendChild(stepDiv);
    });
}

// Toggle fantasy breakdown dropdown
function toggleFantasyBreakdown() {
    const content = document.querySelector('.fantasy-breakdown-content');
    const arrow = document.querySelector('.dropdown-arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.textContent = '▲';
    } else {
        content.style.display = 'none';
        arrow.textContent = '▼';
    }
}

// Make function globally accessible
window.toggleFantasyBreakdown = toggleFantasyBreakdown;