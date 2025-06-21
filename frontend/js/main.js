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
        
        document.getElementById('sort-team').addEventListener('click', function() {
            window.currentSortBy = 'team';
            window.sortDirection = 'desc'; // Reset to default
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
            
            // Handle section switching (for now just Rankings is functional)
            const section = item.getAttribute('data-section');
            if (section === 'rankings') {
                // Already showing rankings - no change needed
            } else {
                // Future sections - show placeholder for now
                console.log(`Switched to ${section} section`);
                // You can add functionality for other sections here later
            }
        });
    });
}

// Initialize navigation when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
});