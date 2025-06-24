from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import time

# Import data fetching functions from get_data module
from get_data import (
    fetch_and_cache_players, 
    get_season_info,
    get_last_season_info,
    NBA_API_AVAILABLE
)

# Database imports commented out - no PostgreSQL server available
# from dotenv import load_dotenv
# load_dotenv()
# try:
#     from database import (
#         init_database, save_players_to_db, get_players_from_db, 
#         check_data_freshness, get_db_connection, get_season_stats
#     )
#     DATABASE_AVAILABLE = True
#     print("Database module loaded successfully")
# except ImportError as e:
#     DATABASE_AVAILABLE = False
#     print(f"Database module not available: {e}")
# except Exception as e:
#     DATABASE_AVAILABLE = False
#     print(f"Database connection issue: {e}")
DATABASE_AVAILABLE = False

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Cache for storing player data
cache = {
    'data': None,
    'timestamp': 0,
    'duration': 3600  # Cache for 1 hour
}

# Cache for injury data
injury_cache = {
    'data': None,
    'timestamp': 0,
    'duration': 21600  # Cache for 6 hours
}

# Cache for player bio data (position, height, weight, jersey)
bio_cache = {
    'data': None,
    'timestamp': 0,
    'duration': 86400  # Cache for 24 hours (bio data refreshes daily)
}

# Cache for last season data (historical data - cache longer)
last_season_cache = {
    'data': None,
    'timestamp': 0,
    'duration': 604800  # Cache for 7 days (historical data won't change)
}

# Serve the frontend
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

# API endpoint to check health of server and availability of nba_api
@app.route('/api/health')
def health_check():
    season_info = get_season_info()
    last_season_info = get_last_season_info()
    
    # Database status commented out
    # db_status = {"available": DATABASE_AVAILABLE, "connected": False, "seasons": []}
    # if DATABASE_AVAILABLE:
    #     try:
    #         conn = get_db_connection()
    #         if conn:
    #             db_status["connected"] = True
    #             conn.close()
    #             db_status["seasons"] = get_season_stats()
    #     except Exception as e:
    #         db_status["error"] = str(e)
    
    return jsonify({
        "status": "ok", 
        "nba_api_available": NBA_API_AVAILABLE,
        # "database_status": db_status,
        "season_info": season_info,
        "last_season_info": last_season_info
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
        return jsonify(cache['data'])
    
    # If no cache, fetch fresh data
    fresh_data = fetch_and_cache_players(cache, injury_cache, bio_cache)
    
    if fresh_data:
        return jsonify(fresh_data)
    else:
        return jsonify({
            'error': 'Failed to fetch NBA data',
            'message': 'Could not retrieve player data'
        }), 500

# API endpoint to get last season player stats
@app.route('/api/players/last-season')
def get_last_season_players():
    if not NBA_API_AVAILABLE:
        return jsonify({
            "error": "nba_api not installed",
            "message": "Run: pip3 install nba_api flask flask-cors"
        }), 500

    # Check cache first
    current_time = time.time()
    if last_season_cache['data'] and (current_time - last_season_cache['timestamp']) < last_season_cache['duration']:
        return jsonify(last_season_cache['data'])
    
    # If no cache, fetch fresh data for last season
    last_season_info = get_last_season_info()
    last_season = last_season_info['stats_season']
    
    fresh_data = fetch_and_cache_players(last_season_cache, injury_cache, bio_cache, season=last_season)
    
    if fresh_data:
        return jsonify(fresh_data)
    else:
        return jsonify({
            'error': 'Failed to fetch last season NBA data',
            'message': f'Could not retrieve player data for {last_season}'
        }), 500

# API endpoint to get comparison between current and last season
@app.route('/api/players/comparison')
def get_season_comparison():
    if not NBA_API_AVAILABLE:
        return jsonify({
            "error": "nba_api not installed",
            "message": "Run: pip3 install nba_api flask flask-cors"
        }), 500
    
    # Get current season data
    current_time = time.time()
    current_data = None
    if cache['data'] and (current_time - cache['timestamp']) < cache['duration']:
        current_data = cache['data']
    else:
        current_data = fetch_and_cache_players(cache, injury_cache, bio_cache)
    
    # Get last season data
    last_season_data = None
    if last_season_cache['data'] and (current_time - last_season_cache['timestamp']) < last_season_cache['duration']:
        last_season_data = last_season_cache['data']
    else:
        last_season_info = get_last_season_info()
        last_season = last_season_info['stats_season']
        last_season_data = fetch_and_cache_players(last_season_cache, injury_cache, bio_cache, season=last_season)
    
    if current_data and last_season_data:
        return jsonify({
            'current_season': current_data,
            'last_season': last_season_data
        })
    else:
        return jsonify({
            'error': 'Failed to fetch comparison data',
            'message': 'Could not retrieve data for both seasons'
        }), 500

# API endpoint to refresh cache
@app.route('/api/refresh')
def refresh_cache():
    fresh_data = fetch_and_cache_players(cache, injury_cache, bio_cache)
    
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
    print("Starting NBA API server... (Database disabled - no PostgreSQL server)")
    
    # Database initialization commented out
    # if DATABASE_AVAILABLE:
    #     try:
    #         print("Initializing database...")
    #         init_database()
    #         print("Database initialized successfully")
    #     except Exception as e:
    #         print(f"Database initialization failed: {e}")
    #         print("Continuing without database...")
    
    # Pre-fetch data on startup for instant loading
    fetch_and_cache_players(cache, injury_cache, bio_cache)
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Server running on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)