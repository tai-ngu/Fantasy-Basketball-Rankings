// Main Application Logic for Fantasy Basketball Rankings

// Main function to fetch and display players
async function fetchAndDisplayPlayers() {
    try {
        const players = await fetchPlayerData();
        
        // Calculate fantasy values for ALL players
        const playersWithFantasyValues = players.map(player => ({
            ...player,
            fantasyValue: fantasyAlgorithm.calculateFantasyValue(player)
        }));
        
        // Update the global playersData with fantasy values
        playersData = playersWithFantasyValues;
        window.playersData = playersWithFantasyValues;
        
        // Store current season data for season toggle
        currentSeasonData = playersWithFantasyValues;
        
        displayPlayers(playersWithFantasyValues);
        
        // Populate team dropdown
        populateTeamDropdown(playersWithFantasyValues);
        
        // Show search section
        document.getElementById('search-section').style.display = 'block';
        
        // Add search and filter functionality
        const searchInput = document.getElementById('player-search');
        let currentTeamFilter = 'all';
        let currentPositionFilter = 'all';
        let currentInjuryFilter = 'all';
        
        function updatePlayerDisplay() {
            displayPlayers(playersWithFantasyValues, searchInput.value, currentTeamFilter, currentPositionFilter, currentInjuryFilter, window.currentSortBy);
        }
        
        searchInput.addEventListener('input', updatePlayerDisplay);
        
        // Team dropdown functionality
        setupTeamDropdown((newTeamFilter) => {
            currentTeamFilter = newTeamFilter;
            updatePlayerDisplay();
        });
        
        // Injury dropdown functionality
        setupInjuryDropdown((newInjuryFilter) => {
            currentInjuryFilter = newInjuryFilter;
            updatePlayerDisplay();
        });
        
        // Position dropdown functionality
        setupPositionDropdown((newPositionFilter) => {
            currentPositionFilter = newPositionFilter;
            updatePlayerDisplay();
        });
        
        // Stat dropdown functionality
        setupStatDropdown((newSortBy) => {
            window.currentSortBy = newSortBy;
            window.sortDirection = 'desc'; // Reset to default when changing stat
            updateSortDirectionButton();
            updatePlayerDisplay();
        });
        
        // Sort direction button functionality
        setupSortDirectionButton(updatePlayerDisplay);
        
        // Initialize the sort direction button
        updateSortDirectionButton();
        
        // Add sorting functionality
        document.getElementById('sort-fantasy').addEventListener('click', function() {
            window.currentSortBy = 'fantasy';
            window.sortDirection = 'desc'; // Reset to default
            updateSortDirectionButton();
            updatePlayerDisplay();
        });
        
        document.getElementById('sort-name').addEventListener('click', function() {
            window.currentSortBy = 'name';
            window.sortDirection = 'desc'; // Reset to default (Z-A for names)
            updateSortDirectionButton();
            updatePlayerDisplay();
        });
        
        
    } catch (error) {
        console.error('Failed to fetch and display players:', error);
    }
}

// Setup navigation functionality
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Handle section switching
            const section = item.getAttribute('data-section');
            if (section === 'rankings') {
                showRankingsSection();
            } else if (section === 'about') {
                showAboutSection();
            }
        });
    });
}

// Function to show rankings section
function showRankingsSection() {
    document.getElementById('search-section').style.display = 'block';
    document.getElementById('player-list').style.display = 'grid';
    document.getElementById('about-section').style.display = 'none';
    
    // Show player count info when returning to rankings
    const playerCountInfo = document.querySelector('.player-count-info');
    if (playerCountInfo) {
        playerCountInfo.style.display = 'block';
    }
}

// Function to show about section
function showAboutSection() {
    document.getElementById('search-section').style.display = 'none';
    document.getElementById('player-list').style.display = 'none';
    document.getElementById('about-section').style.display = 'block';
    
    // Hide player count info when showing about section
    const playerCountInfo = document.querySelector('.player-count-info');
    if (playerCountInfo) {
        playerCountInfo.style.display = 'none';
    }
}

// Global variables for season management
let currentSeasonData = null;
let lastSeasonData = null;
let currentViewingSeason = 'current'; // 'current' or 'last'

// Setup season toggle functionality
function setupSeasonToggle() {
    const currentSeasonBtn = document.getElementById('current-season-btn');
    const lastSeasonBtn = document.getElementById('last-season-btn');
    
    if (!currentSeasonBtn || !lastSeasonBtn) return;
    
    currentSeasonBtn.addEventListener('click', () => {
        if (currentViewingSeason !== 'current') {
            currentViewingSeason = 'current';
            updateSeasonButtons();
            if (currentSeasonData) {
                displayPlayersForSeason(currentSeasonData);
            }
        }
    });
    
    lastSeasonBtn.addEventListener('click', async () => {
        if (currentViewingSeason !== 'last') {
            currentViewingSeason = 'last';
            updateSeasonButtons();
            
            // Fetch last season data if not already loaded
            if (!lastSeasonData) {
                try {
                    // Ensure season button labels are updated
                    await checkBackend();
                    lastSeasonData = await fetchLastSeasonPlayerData();
                    // Calculate fantasy values for last season data
                    const playersWithFantasyValues = lastSeasonData.map(player => ({
                        ...player,
                        fantasyValue: fantasyAlgorithm.calculateFantasyValue(player)
                    }));
                    lastSeasonData = playersWithFantasyValues;
                    window.lastSeasonData = lastSeasonData;
                } catch (error) {
                    console.error('Failed to fetch last season data:', error);
                    return;
                }
            }
            
            displayPlayersForSeason(lastSeasonData);
        }
    });
}

function updateSeasonButtons() {
    const currentSeasonBtn = document.getElementById('current-season-btn');
    const lastSeasonBtn = document.getElementById('last-season-btn');
    
    if (currentViewingSeason === 'current') {
        currentSeasonBtn.classList.add('active');
        lastSeasonBtn.classList.remove('active');
    } else {
        currentSeasonBtn.classList.remove('active');
        lastSeasonBtn.classList.add('active');
    }
}

function displayPlayersForSeason(players) {
    // Use the existing display logic but with different player data
    window.playersData = players;
    displayPlayers(players);
    
    // Update search functionality to work with current dataset
    const searchInput = document.getElementById('player-search');
    searchInput.value = ''; // Clear search when switching seasons
}

// Function to update rankings for a selected season
async function updateRankingsForSeason(selectedSeason) {
    try {
        updateStatus('Loading rankings for ' + selectedSeason + '...', 'loading');
        
        let playersData;
        
        if (selectedSeason === '2025-26') {
            // Current/upcoming season - use main API endpoint
            playersData = await fetchPlayerData();
        } else if (selectedSeason === '2024-25') {
            // Last season - use last season API endpoint
            playersData = await fetchLastSeasonPlayerData();
        }
        
        // Calculate fantasy values
        const playersWithFantasyValues = playersData.map(player => ({
            ...player,
            fantasyValue: fantasyAlgorithm.calculateFantasyValue(player)
        }));
        
        // Update global data and display
        window.playersData = playersWithFantasyValues;
        displayPlayers(playersWithFantasyValues);
        
        // Update team dropdown for new data
        populateTeamDropdown(playersWithFantasyValues);
        
        // Clear any filters/search
        document.getElementById('player-search').value = '';
        
        // Hide status message
        const statusEl = document.getElementById('status');
        statusEl.style.display = 'none';
        
    } catch (error) {
        console.error('Error updating rankings for season:', selectedSeason, error);
        updateStatus('Error loading data for ' + selectedSeason, 'error');
    }
}

// Season dropdown functionality
function setupSeasonDropdown() {
    const dropdownBtn = document.getElementById('season-dropdown-btn');
    const dropdownMenu = document.getElementById('season-dropdown-menu');
    const seasonSubtitle = document.getElementById('season-subtitle');
    
    if (!dropdownBtn || !dropdownMenu || !seasonSubtitle) return;
    
    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Handle season selection
    dropdownMenu.addEventListener('click', async (e) => {
        if (e.target.classList.contains('season-dropdown-item')) {
            const selectedSeason = e.target.dataset.season;
            seasonSubtitle.textContent = `(${selectedSeason})`;
            dropdownMenu.style.display = 'none';
            
            // Update rankings based on selected season
            await updateRankingsForSeason(selectedSeason);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
}

// Initialize navigation when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupSeasonToggle();
    setupSeasonDropdown();
});