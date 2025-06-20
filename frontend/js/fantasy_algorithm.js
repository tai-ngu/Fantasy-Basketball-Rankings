// Fantasy Basketball Calculation Algorithm

class FantasyAlgorithm {
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
            turnovers: -1.5    // Turnovers: -1.5 points
        };
    }

    // Calculate fantasy value for a player
    calculateFantasyValue(player) {
        if (!player || player.games_played === 0) return 0;

        let score = 0;
        const gamesPlayed = player.games_played;
        
        // Calculate per-game stats and scores
        const fg3mPerGame = (player.fg3m || 0) / gamesPlayed;
        const fg2mPerGame = ((player.fgm || 0) - (player.fg3m || 0)) / gamesPlayed;
        const ftmPerGame = (player.ftm || 0) / gamesPlayed;
        const rebPerGame = (player.rebounds || 0) / gamesPlayed;
        const astPerGame = (player.assists || 0) / gamesPlayed;
        const stlPerGame = (player.steals || 0) / gamesPlayed;
        const blkPerGame = (player.blocks || 0) / gamesPlayed;
        const tovPerGame = (player.turnovers || 0) / gamesPlayed;
        
        // Calculate base score
        score += fg3mPerGame * this.weights.fg3m;
        score += fg2mPerGame * this.weights.fg2m;
        score += ftmPerGame * this.weights.ftm;
        score += rebPerGame * this.weights.rebounds;
        score += astPerGame * this.weights.assists;
        score += stlPerGame * this.weights.steals;
        score += blkPerGame * this.weights.blocks;
        score += tovPerGame * this.weights.turnovers;
        
        // Games played multiplier
        const gamesPlayedMultiplier = player.games_played >= 70 ? Math.min(player.games_played / 70, 1.1) : 1.0;
        score *= gamesPlayedMultiplier;
        
        return Math.max(score, 0); // Don't allow negative scores
    }

    // Generate detailed fantasy breakdown for player modal
    generateFantasyBreakdown(player) {
        if (!player || player.games_played === 0) {
            return {
                perGameStats: {},
                categoryScores: {},
                multipliers: {},
                steps: [],
                baseScore: 0,
                finalScore: 0
            };
        }

        const breakdown = {
            perGameStats: {},
            categoryScores: {},
            multipliers: {},
            steps: []
        };
        
        const gamesPlayed = player.games_played;
        
        // Calculate per-game stats
        const fg3mPerGame = (player.fg3m || 0) / gamesPlayed;
        const fg2mPerGame = ((player.fgm || 0) - (player.fg3m || 0)) / gamesPlayed;
        const ftmPerGame = (player.ftm || 0) / gamesPlayed;
        const rebPerGame = (player.rebounds || 0) / gamesPlayed;
        const astPerGame = (player.assists || 0) / gamesPlayed;
        const stlPerGame = (player.steals || 0) / gamesPlayed;
        const blkPerGame = (player.blocks || 0) / gamesPlayed;
        const tovPerGame = (player.turnovers || 0) / gamesPlayed;
        
        // Store per-game stats
        breakdown.perGameStats = {
            fg3m: fg3mPerGame,
            fg2m: fg2mPerGame,
            ftm: ftmPerGame,
            rebounds: rebPerGame,
            assists: astPerGame,
            steals: stlPerGame,
            blocks: blkPerGame,
            turnovers: tovPerGame,
            games: gamesPlayed
        };
        
        // Calculate scores for each category
        const fg3mScore = fg3mPerGame * this.weights.fg3m;
        const fg2mScore = fg2mPerGame * this.weights.fg2m;
        const ftmScore = ftmPerGame * this.weights.ftm;
        const rebScore = rebPerGame * this.weights.rebounds;
        const astScore = astPerGame * this.weights.assists;
        const stlScore = stlPerGame * this.weights.steals;
        const blkScore = blkPerGame * this.weights.blocks;
        const tovScore = tovPerGame * this.weights.turnovers;
        
        // Store category scores
        breakdown.categoryScores = {
            fg3m: fg3mScore,
            fg2m: fg2mScore,
            ftm: ftmScore,
            rebounds: rebScore,
            assists: astScore,
            steals: stlScore,
            blocks: blkScore,
            turnovers: tovScore
        };
        
        // Add detailed calculation steps
        breakdown.steps = [
            `3PM: ${fg3mPerGame.toFixed(2)} × ${this.weights.fg3m} = ${fg3mScore.toFixed(2)}`,
            `2PM: ${fg2mPerGame.toFixed(2)} × ${this.weights.fg2m} = ${fg2mScore.toFixed(2)}`,
            `FTM: ${ftmPerGame.toFixed(2)} × ${this.weights.ftm} = ${ftmScore.toFixed(2)}`,
            `REB: ${rebPerGame.toFixed(2)} × ${this.weights.rebounds} = ${rebScore.toFixed(2)}`,
            `AST: ${astPerGame.toFixed(2)} × ${this.weights.assists} = ${astScore.toFixed(2)}`,
            `STL: ${stlPerGame.toFixed(2)} × ${this.weights.steals} = ${stlScore.toFixed(2)}`,
            `BLK: ${blkPerGame.toFixed(2)} × ${this.weights.blocks} = ${blkScore.toFixed(2)}`,
            `TOV: ${tovPerGame.toFixed(2)} × ${this.weights.turnovers} = ${tovScore.toFixed(2)}`
        ];
        
        // Sum up base score
        const baseScore = fg3mScore + fg2mScore + ftmScore + rebScore + astScore + stlScore + blkScore + tovScore;
        breakdown.baseScore = baseScore;
        
        // Games played multiplier
        const gamesPlayedMultiplier = player.games_played >= 70 ? Math.min(player.games_played / 70, 1.1) : 1.0;
        breakdown.multipliers.gamesPlayed = gamesPlayedMultiplier;
        
        const finalScore = baseScore * gamesPlayedMultiplier;
        breakdown.finalScore = Math.max(finalScore, 0);
        
        return breakdown;
    }

    // Get detailed fantasy breakdown for a player
    getFantasyBreakdown(player) {
        return this.generateFantasyBreakdown(player);
    }
}

// Initialize the fantasy algorithm
const fantasyAlgorithm = new FantasyAlgorithm();