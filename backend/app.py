from flask import Flask, jsonify
from flask_cors import CORS
import json

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

    # API endpoint to check health of server and availability of nba_api
@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "nba_api_available": NBA_API_AVAILABLE})
    
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
                    'games_played': player.get('GP'),
                    'minutes': player.get('MIN'),
                    'points': player.get('PTS'),
                    'rebounds': player.get('REB'),
                    'assists': player.get('AST'),
                    'steals': player.get('STL'),
                    'blocks': player.get('BLK'),
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