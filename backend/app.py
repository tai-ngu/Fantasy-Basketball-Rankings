from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime

# Use NBA API to fetch player stats
try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API is not available. Please install the nba_api package with 'pip3 install nba_api'.")

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Cache for storing player data
import time
cache = {
    'data': None,
    'timestamp': 0,
    'duration': 3600  # Cache for 1 hour
}

def fetch_and_cache_players():
    """Fetch player data from NBA API and store in cache"""
    if not NBA_API_AVAILABLE:
        print("NBA API not available, skipping pre-fetch")
        return None
    
    try:
        season_info = get_season_info()
        stats_season = season_info["stats_season"]
        
        print(f"Pre-fetching player data for {stats_season} season...")
        start_time = time.time()
        
        # Fetch player stats for the determined season
        player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=stats_season,
            season_type_all_star='Regular Season',
            timeout=30  # Add timeout to prevent hanging
        )
        
        player_stats_data = player_stats.get_data_frames()[0].to_dict(orient='records')
        
        # Process players
        players = []
        for player in player_stats_data:
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
                    'fgm': player.get('FGM'),
                    'fg3m': player.get('FG3M'),
                    'ftm': player.get('FTM'),
                    'fg_pct': player.get('FG_PCT'),
                    'fg3_pct': player.get('FG3_PCT'),
                    'ft_pct': player.get('FT_PCT'),
                    'turnovers': player.get('TOV')
                })
        
        # Store in cache
        cache['data'] = {
            'players': players,
            'total_count': len(players),
            'stats_season': stats_season,
            'mock_draft_season': season_info["mock_draft_season"],
            'description': season_info["description"]
        }
        cache['timestamp'] = time.time()
        
        elapsed = time.time() - start_time
        print(f"Successfully pre-fetched {len(players)} players in {elapsed:.2f} seconds")
        return cache['data']
        
    except Exception as e:
        print(f"Error pre-fetching NBA data: {str(e)}")
        return None

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
        "description": f"Retrieved player stats for {mock_draft_season} season using {stats_season} stats"
    }

# Serve the frontend
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

# API endpoint to check health of server and availability of nba_api
@app.route('/api/health')
def health_check():
    season_info = get_season_info()
    return jsonify({
        "status": "ok", 
        "nba_api_available": NBA_API_AVAILABLE,
        "season_info": season_info
    })

# API endpoint to get player stats 
@app.route('/api/players')
def get_players():
    if not NBA_API_AVAILABLE:
        return jsonify({
            "error": "nba_api not installed",
            "message": "Run: pip3 install nba_api flask flask-cors"
        }), 500

    # Check cache first
    current_time = time.time()
    if cache['data'] and (current_time - cache['timestamp']) < cache['duration']:
        print("Serving cached data (instant response)")
        return jsonify(cache['data'])
    
    # If no cache, fetch fresh data
    print("Cache miss, fetching fresh data...")
    fresh_data = fetch_and_cache_players()
    
    if fresh_data:
        return jsonify(fresh_data)
    else:
        return jsonify({
            'error': 'Failed to fetch NBA data',
            'message': 'Could not retrieve player data'
        }), 500

# API endpoint to refresh cache
@app.route('/api/refresh')
def refresh_cache():
    print("Manual cache refresh requested...")
    fresh_data = fetch_and_cache_players()
    
    if fresh_data:
        return jsonify({
            'status': 'success',
            'message': 'Cache refreshed successfully',
            'players_count': fresh_data['total_count']
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Failed to refresh cache'
        }), 500

if __name__ == '__main__':
    print("Starting NBA API server...")
    
    # Pre-fetch data on startup for instant loading
    print("Pre-fetching NBA player data for instant loading...")
    fetch_and_cache_players()
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Server will run on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)