// Fantasy Basketball Draft Algorithm

class FantasyDraftAlgorithm {
    constructor() {
        // Weights for different statistical categories (default fantasy basketball values)
        this.weights = {
            fg3m: 3.0,         // Three Point Field Goals: 3 points
            fg2m: 2.0,         // Two Point Field Goals: 2 points
            ftm: 1.0,          // Free Throws Made: 1 point
            rebounds: 1.2,     // Rebounds: 1.2 points
            assists: 1.5,      // Assists: 1.5 points
            blocks: 2.0,       // Blocked Shots: 2 points
            steals: 2.0,       // Steals: 2 points
            turnovers: -1.0    // Turnovers: -1 points
        };
        
    }


    // Calculate fantasy value for a player
    calculateFantasyValue(player) {
    if (!player || player.games_played === 0) return 0;

    let score = 0;
    
    // Convert season totals to per-game averages
    const gamesPlayed = player.games_played;
    
    // Calculate 3-point field goals made per game
    score += ((player.fg3m || 0) / gamesPlayed) * this.weights.fg3m;
    
    // Calculate 2-point field goals made per game (FGM - FG3M)
    const fg2m = ((player.fgm || 0) - (player.fg3m || 0)) / gamesPlayed;
    score += fg2m * this.weights.fg2m;
    
    // Free throws made per game
    score += ((player.ftm || 0) / gamesPlayed) * this.weights.ftm;
    
    // Other stats per game
    score += ((player.rebounds || 0) / gamesPlayed) * this.weights.rebounds;
    score += ((player.assists || 0) / gamesPlayed) * this.weights.assists;
    score += ((player.steals || 0) / gamesPlayed) * this.weights.steals;
    score += ((player.blocks || 0) / gamesPlayed) * this.weights.blocks;
    
    // Turnovers per game (negative impact)
    score += ((player.turnovers || 0) / gamesPlayed) * this.weights.turnovers;

    
    // Games played multiplier (reliability bonus)
    const gamesPlayedMultiplier = Math.min(player.games_played / 70, 1.2); // Cap at 1.2x
    score *= gamesPlayedMultiplier;
    
    return Math.max(score, 0); // Don't allow negative scores
}

    // Rank all players by fantasy value
    rankPlayers(players) {
        return players
            .map(player => ({
                ...player,
                fantasyValue: this.calculateFantasyValue(player)
            }))
            .sort((a, b) => b.fantasyValue - a.fantasyValue)
            .map((player, index) => ({
                ...player,
                draftRank: index + 1
            }));
    }
    
    // Generate mock draft order
    generateMockDraft(players, numTeams = 12, roundsPerTeam = 13) {
        const rankedPlayers = this.rankPlayers(players);
        const totalPicks = numTeams * roundsPerTeam;
        
        const draftOrder = [];
        
        for (let round = 1; round <= roundsPerTeam; round++) {
            // Snake draft: odd rounds go 1->12, even rounds go 12->1
            const pickOrder = round % 2 === 1 
                ? Array.from({length: numTeams}, (_, i) => i + 1)
                : Array.from({length: numTeams}, (_, i) => numTeams - i);
            
            pickOrder.forEach(team => {
                const overallPick = draftOrder.length + 1;
                if (overallPick <= rankedPlayers.length) {
                    const player = rankedPlayers[overallPick - 1];
                    draftOrder.push({
                        overallPick,
                        round,
                        teamPick: pickOrder.indexOf(team) + 1,
                        team,
                        player: player
                    });
                }
            });
        }
        
        return draftOrder.slice(0, Math.min(totalPicks, rankedPlayers.length));
    }
}

// Initialize the draft algorithm
const draftAlgorithm = new FantasyDraftAlgorithm();

// Run mock draft and display results
function runMockDraft() {
    if (!playersData || playersData.length === 0) {
        updateStatus('No player data available. Please fetch data first.', 'error');
        return;
    }
    
    updateStatus('Running mock draft algorithm...', 'loading');
    
    try {
        // Generate the mock draft
        const draftResults = draftAlgorithm.generateMockDraft(playersData);
        
        // Display results
        displayDraftResults(draftResults);
        
        updateStatus(`Mock draft completed! ${draftResults.length} picks generated.`, 'success');
        
    } catch (error) {
        updateStatus(`Error running mock draft: ${error.message}`, 'error');
        console.error('Mock draft error:', error);
    }
}

// Display draft results
function displayDraftResults(draftResults) {
    const resultsEl = document.getElementById('draft-results');
    
    if (!draftResults || draftResults.length === 0) {
        resultsEl.innerHTML = '<p>No draft results to display</p>';
        return;
    }
    
    resultsEl.innerHTML = `
        <h2>Mock Draft Results (First 3 Rounds)</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
            ${draftResults.slice(0, 36).map(pick => `
                <div class="player-card" style="border-left: 4px solid #1976d2;">
                    <div style="font-weight: bold; color: #1976d2;">
                        Pick ${pick.overallPick} (Round ${pick.round}, Pick ${pick.teamPick})
                    </div>
                    <div style="font-size: 1.1em; font-weight: bold; margin: 5px 0;">
                        ${pick.player.name}
                    </div>
                    <div style="font-size: 0.9em; color: #666;">
                        <div>Team: ${pick.player.team}</div>
                        <div>Fantasy Value: ${pick.player.fantasyValue.toFixed(1)}</div>
                        <div>PPG: ${pick.player.points && pick.player.games_played ? (pick.player.points / pick.player.games_played).toFixed(1) : 'N/A'} | 
                             RPG: ${pick.player.rebounds && pick.player.games_played ? (pick.player.rebounds / pick.player.games_played).toFixed(1) : 'N/A'} | 
                             APG: ${pick.player.assists && pick.player.games_played ? (pick.player.assists / pick.player.games_played).toFixed(1) : 'N/A'}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}