from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import time

# Import data fetching functions from get_data module
from get_data import (
    fetch_players, 
    get_season_info,
    get_last_season,
    NBA_API_AVAILABLE
)


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

# Cache for player bio data
bio_cache = {
    'data': None,
    'timestamp': 0,
    'duration': 86400  # Cache for 24 hours
}

# Cache for last season data 
last_season_cache = {
    'data': None,
    'timestamp': 0,
    'duration': 604800  # Cache for 7 days
}

# Serve the frontend
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

# API endpoint to check health of server and availability of nba_api
@app.route('/api/health')
def health_check():
    season_info = get_season_info()
    last_season_info = get_last_season()
    
    return jsonify({
        "status": "ok", 
        "nba_api_available": NBA_API_AVAILABLE,
        "season_info": season_info,
        "last_season_info": last_season_info
    })

# API endpoint to get player stats 
@app.route('/api/players')
def get_players():
    start_time = time.time()
    
    if not NBA_API_AVAILABLE:
        return jsonify({
            "error": "nba_api not installed",
            "message": "Run: pip3 install nba_api flask flask-cors"
        }), 500

    # Check cache first
    current_time = time.time()
    
    if cache['data'] and (current_time - cache['timestamp']) < cache['duration']:
        cache_age = current_time - cache['timestamp']
        response_time = time.time() - start_time
        print(f"📦 Cache: {response_time:.3f}s (age: {cache_age:.0f}s)")
        return jsonify(cache['data'])
    
    # If no cache, fetch fresh data
    fetch_start = time.time()
    fresh_data = fetch_players(cache, injury_cache, bio_cache)
    
    if fresh_data:
        total_time = time.time() - start_time
        print(f"🔄 Fresh: {total_time:.3f}s")
        return jsonify(fresh_data)
    else:
        error_time = time.time() - start_time
        print(f"❌ Error: {error_time:.3f}s")
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
    last_season_info = get_last_season()
    last_season = last_season_info['stats_season']
    
    fresh_data = fetch_players(last_season_cache, injury_cache, bio_cache, season=last_season)
    
    if fresh_data:
        return jsonify(fresh_data)
    else:
        return jsonify({
            'error': 'Failed to fetch last season NBA data',
            'message': f'Could not retrieve player data for {last_season}'
        }), 500


if __name__ == '__main__':
    print("🚀 Starting server...")
    
    # Pre-fetch data on startup for instant loading
    prefetch_start = time.time()
    fetch_players(cache, injury_cache, bio_cache)
    prefetch_time = time.time() - prefetch_start
    
    port = int(os.environ.get('PORT', 5000))
    
    print(f"✅ Startup: {prefetch_time:.3f}s")
    print(f"🌐 Server running on port {port}")
    
    app.run(debug=False, host='0.0.0.0', port=port)