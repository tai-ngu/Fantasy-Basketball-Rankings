from flask import Flask, jsonify
from flask_cors import CORS
import json
from datetime import datetime

# Use NBA API to fetch player stats
try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    from nba_api.stats.library.parameters import SeasonAll
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API is not available. Please install the nba_api package with 'pip3 install nba_api'.")

app = Flask(__name__) # Create Flask app instance
CORS(app) # Use CORS to allow frontend to access the backend

def get_season_info():
    """
    Dynamically determine the current mock draft season and the previous season for stats.
    NBA seasons run from October to June, so:
    - If current month is June-September: use current year as end of previous season
    - If current month is October-May: use current year as end of current season
    """
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    if current_month >= 10:  # October-December: new season has started
        # Mock draft for next season, using current season stats
        mock_draft_season = f"{current_year + 1}-{str(current_year + 2)[2:]}"
        stats_season = f"{current_year}-{str(current_year + 1)[2:]}"
    elif current_month <= 6:  # January-June: season is ongoing
        # Mock draft for next season, using current season stats
        mock_draft_season = f"{current_year}-{str(current_year + 1)[2:]}"
        stats_season = f"{current_year - 1}-{str(current_year)[2:]}"
    else:  # July-September: offseason
        # Mock draft for upcoming season, using previous season stats
        mock_draft_season = f"{current_year}-{str(current_year + 1)[2:]}"
        stats_season = f"{current_year - 1}-{str(current_year)[2:]}"
    
    return {
        "mock_draft_season": mock_draft_season,
        "stats_season": stats_season,
        "description": f"Mock Draft for {mock_draft_season} season using {stats_season} stats"
    }

# API endpoint to check health of server and availability of nba_api
@app.route('/api/health')
def health_check():
    season_info = get_season_info()
    return jsonify({
        "status": "ok", 
        "nba_api_available": NBA_API_AVAILABLE,
        "season_info": season_info
    })

# Dynamic API endpoint to get player stats for mock draft
@app.route('/api/players')
def get_players():
    if not NBA_API_AVAILABLE:
        return jsonify({
            "error": "nba_api not installed",
            "message": "Run: pip3 install nba_api flask flask-cors"
        }), 500

    try:
        season_info = get_season_info()
        stats_season = season_info["stats_season"]
        
        # Fetch player stats for the determined season
        player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=stats_season,
            season_type_all_star='Regular Season'
        )

        # Convert the data to a list of dictionaries using pandas
        player_stats_data = player_stats.get_data_frames()[0].to_dict(orient='records')

        # Filter and clean the data
        players = []
        for player in player_stats_data:
            # Only include players who have played games
            if player.get('GP', 0) > 0:
                players.append({
                    'player_id': player.get('PLAYER_ID'),
                    'name': player.get('PLAYER_NAME'),
                    'team': player.get('TEAM_ABBREVIATION'),
                    'position': player.get('POSITION'),
                    'games_played': player.get('GP'),
                    'minutes': player.get('MIN'),
                    'points': player.get('PTS'),
                    'rebounds': player.get('REB'),
                    'assists': player.get('AST'),
                    'steals': player.get('STL'),
                    'blocks': player.get('BLK'),
                    'fgm': player.get('FGM'),
                    'fg3m': player.get('FG3M'),
                    'ftm': player.get('FTM'),
                    'fg_pct': player.get('FG_PCT'),
                    'fg3_pct': player.get('FG3_PCT'),
                    'ft_pct': player.get('FT_PCT'),
                    'turnovers': player.get('TOV')
                })
        
        print(f"Successfully fetched {len(players)} players from {stats_season} season")
        return jsonify({
            'players': players,
            'total_count': len(players),
            'stats_season': stats_season,
            'mock_draft_season': season_info["mock_draft_season"],
            'description': season_info["description"]
        })
    
    # Handle any exceptions that occur during the API call
    except Exception as e:
        print(f"Error fetching NBA data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch NBA data',
            'message': str(e)
        }), 500
    
    # API endpoint to get player stats for the 2024-25 season
@app.route('/api/players/2024-25')
def get_players_2024_25():
    if not NBA_API_AVAILABLE:
        return jsonify({
            "error": "nba_api not installed",
            "message": "Run: pip3 install nba_api flask flask-cors"
    }), 500

    try:
        # Fetch player stats for the 2024-25 season
        player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season = '2024-25',
            season_type_all_star = 'Regular Season'
        )

        # Convert the data to a list of dictionaries using pandas
        player_stats_data = player_stats.get_data_frames()[0].to_dict(orient='records')

        # Filter and clean the data
        players = []
        for player in player_stats_data:
            # Only include players who have played games
            if player.get('GP', 0) > 0:
                players.append({
                   'player_id': player.get('PLAYER_ID'),
                    'name': player.get('PLAYER_NAME'),
                    'team': player.get('TEAM_ABBREVIATION'),
                    'position': player.get('POSITION'),
                    'games_played': player.get('GP'),
                    'minutes': player.get('MIN'),
                    'points': player.get('PTS'),
                    'rebounds': player.get('REB'),
                    'assists': player.get('AST'),
                    'steals': player.get('STL'),
                    'blocks': player.get('BLK'),
                    'fgm': player.get('FGM'),
                    'fg3m': player.get('FG3M'),
                    'ftm': player.get('FTM'),
                    'fg_pct': player.get('FG_PCT'),
                    'fg3_pct': player.get('FG3_PCT'),
                    'ft_pct': player.get('FT_PCT'),
                    'turnovers': player.get('TOV')
                })
        
        print(f"Successfully fetched {len(players)} players")
        return jsonify({
            'players': players,
            'total_count': len(players),
            'season': '2024-25'
        })
    
    # Handle any exceptions that occur during the API call
    except Exception as e:
        print(f"Error fetching NBA data: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch NBA data',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting NBA API server...")
    print("Make sure you have installed: pip3 install nba_api flask flask-cors")
    print("Server will run on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
