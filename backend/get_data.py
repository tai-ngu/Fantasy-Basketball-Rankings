"""
Data fetching module for NBA player statistics, injury data, and biographical information.
This module handles all external API calls and data processing.
"""

import requests
import aiohttp
import asyncio
import pickle
import time
import os
import unicodedata
from datetime import datetime

# Use NBA API to fetch player stats
try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API is not available. Please install the nba_api package with 'pip3 install nba_api'.")

# ESPN Team ID mapping for NBA teams
ESPN_TEAM_IDS = {
    'ATL': 1, 'BOS': 2, 'BKN': 17, 'CHA': 30, 'CHI': 4, 'CLE': 5,
    'DAL': 6, 'DEN': 7, 'DET': 8, 'GSW': 9, 'HOU': 10, 'IND': 11,
    'LAC': 12, 'LAL': 13, 'MEM': 29, 'MIA': 14, 'MIL': 15, 'MIN': 16,
    'NOP': 3, 'NYK': 18, 'OKC': 25, 'ORL': 19, 'PHI': 20, 'PHX': 21,
    'POR': 22, 'SAC': 23, 'SAS': 24, 'TOR': 28, 'UTA': 26, 'WAS': 27
}

# File paths for persistent caching
CACHE_DIR = 'cache'
BIO_CACHE_FILE = os.path.join(CACHE_DIR, 'bio_cache.pkl')
INJURY_CACHE_FILE = os.path.join(CACHE_DIR, 'injury_cache.pkl')

def normalize_name(name):
    """Normalize player names by removing diacritics and standardizing format"""
    if not name:
        return ""
    
    normalized = unicodedata.normalize('NFD', name)
    ascii_name = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    
    # Additional common character replacements
    replacements = {
        'ć': 'c', 'č': 'c',
        'š': 's', 'ž': 'z',
        'ñ': 'n', 'ü': 'u', 'ö': 'o', 'ä': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u',
        'ý': 'y', 'ÿ': 'y'
    }
    
    for accented, plain in replacements.items():
        ascii_name = ascii_name.replace(accented, plain)
        ascii_name = ascii_name.replace(accented.upper(), plain.upper())
    
    # Clean up extra spaces and return
    return ' '.join(ascii_name.split())

def load_cache_from_file(cache_file, cache_dict):
    """Load cached data from file if it exists and is valid"""
    try:
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                cached_data = pickle.load(f)
                
            # Check if cache is still valid
            current_time = time.time()
            if (current_time - cached_data['timestamp']) < cache_dict['duration']:
                cache_dict['data'] = cached_data['data']
                cache_dict['timestamp'] = cached_data['timestamp']
                return True
    except Exception as e:
        print(f"Error loading cache from {cache_file}: {e}")
    
    return False

def save_cache_to_file(cache_file, cache_dict):
    """Save cached data to file"""
    try:
        # Create cache directory if it doesn't exist
        os.makedirs(CACHE_DIR, exist_ok=True)
        
        # Save cache data
        cache_data = {
            'data': cache_dict['data'],
            'timestamp': cache_dict['timestamp']
        }
        
        with open(cache_file, 'wb') as f:
            pickle.dump(cache_data, f)
            
    except Exception as e:
        print(f"Error saving cache to {cache_file}: {e}")

def fetch_injury_data(injury_cache):
    """Fetch real injury data from multiple sources"""
    current_time = time.time()
    
    # Check in-memory cache first
    if injury_cache['data'] and (current_time - injury_cache['timestamp']) < injury_cache['duration']:
        return injury_cache['data']
    
    # Try loading from file cache
    if load_cache_from_file(INJURY_CACHE_FILE, injury_cache):
        return injury_cache['data']
    
    injury_data = {}
    start_time = time.time()
    
    try:
        # Try ESPN API v3 (correct structure based on actual response)
        try:
            url = "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Parse injury data - correct structure
                if 'injuries' in data:
                    for team_data in data['injuries']:
                        if 'injuries' in team_data:
                            for injury in team_data['injuries']:
                                athlete = injury.get('athlete', {})
                                player_name = athlete.get('displayName', '')
                                injury_status = injury.get('status', 'Unknown')
                                
                                # Get detailed injury information
                                injury_details = injury.get('details', {})
                                injury_type = injury_details.get('type', 'Unknown')
                                injury_detail = injury_details.get('detail', '')
                                injury_side = injury_details.get('side', '')
                                return_date = injury_details.get('returnDate', '')
                                
                                # Build comprehensive injury description
                                injury_description = injury_type
                                if injury_detail and injury_detail != injury_type:
                                    injury_description += f" ({injury_detail})"
                                if injury_side and injury_side != 'Not Specified':
                                    injury_description += f" - {injury_side}"
                                
                                # Parse return date for timeline
                                timeline = ''
                                if return_date:
                                    try:
                                        return_dt = datetime.fromisoformat(return_date.replace('Z', '+00:00'))
                                        current_dt = datetime.now(return_dt.tzinfo)
                                        
                                        if return_dt > current_dt:
                                            # Calculate days until return
                                            days_until = (return_dt - current_dt).days
                                            if days_until < 30:
                                                timeline = f"{days_until} days"
                                            elif days_until < 365:
                                                months = days_until // 30
                                                timeline = f"{months} month{'s' if months > 1 else ''}"
                                            else:
                                                timeline = "Long-term"
                                        else:
                                            timeline = "Expected back"
                                    except:
                                        timeline = ''
                                
                                # Get team abbreviation
                                team_abbr = 'Unknown'
                                if athlete.get('team', {}).get('abbreviation'):
                                    team_abbr = athlete['team']['abbreviation']
                                
                                if player_name and injury_status and injury_status.lower() != 'healthy':
                                    injury_data[player_name] = {
                                        'status': injury_status,
                                        'injury': injury_description,
                                        'timeline': timeline,
                                        'return_date': return_date,
                                        'team': team_abbr
                                    }
                                    
        except Exception as e:
            pass
        
        elapsed_time = time.time() - start_time
        print(f"Fetched ESPN injury data in {elapsed_time:.2f}s ({len(injury_data)} injuries)")
        
        
        # Cache the results in memory and file
        injury_cache['data'] = injury_data
        injury_cache['timestamp'] = current_time
        save_cache_to_file(INJURY_CACHE_FILE, injury_cache)
        
        return injury_data
        
    except Exception as e:
        return {}

async def fetch_team_roster(session, team_abbr, team_id, semaphore):
    """Fetch roster data for a single team asynchronously"""
    async with semaphore:  # Limit concurrent requests
        try:
            url = f"http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{team_id}/roster"
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    team_bio_data = {}
                    if 'athletes' in data:
                        for athlete in data['athletes']:
                            player_name = athlete.get('displayName', '')
                            
                            if player_name:
                                # Extract bio data
                                position_data = athlete.get('position', {})
                                position = position_data.get('abbreviation', '') if isinstance(position_data, dict) else str(position_data) if position_data else ''
                                
                                height = athlete.get('displayHeight', '').replace("' ", "'")
                                weight = athlete.get('displayWeight', '')
                                jersey = athlete.get('jersey', '')
                                age = athlete.get('age', '')
                                
                                # Get birth info if available
                                birthdate = ''
                                birthplace = ''
                                if 'birthDate' in athlete:
                                    birthdate = athlete.get('birthDate', '')
                                if 'birthPlace' in athlete:
                                    birth_info = athlete.get('birthPlace', {})
                                    if isinstance(birth_info, dict):
                                        city = birth_info.get('city', '')
                                        state = birth_info.get('state', '')
                                        country = birth_info.get('country', '')
                                        birthplace = ', '.join(filter(None, [city, state, country]))
                                    else:
                                        birthplace = str(birth_info) if birth_info else ''
                                
                                # Get college/draft info if available
                                college = ''
                                if 'college' in athlete:
                                    college_info = athlete.get('college', {})
                                    if isinstance(college_info, dict):
                                        college = college_info.get('name', '')
                                    else:
                                        college = str(college_info) if college_info else ''
                                
                                # Normalize the name for matching
                                normalized_name = normalize_name(player_name)
                                
                                player_bio = {
                                    'position': position,
                                    'height': height,
                                    'weight': weight,
                                    'jersey': str(jersey) if jersey else '',
                                    'age': str(age) if age else '',
                                    'birthdate': birthdate,
                                    'birthplace': birthplace,
                                    'college': college,
                                    'team': team_abbr,
                                    'original_name': player_name
                                }
                                
                                team_bio_data[normalized_name] = player_bio
                                team_bio_data[player_name] = player_bio
                    
                    return team_bio_data
                    
        except Exception as e:
            return {}
        
        return {}

async def fetch_player_bio_data_async():
    """Fetch player biographical data concurrently from ESPN API"""
    bio_data = {}
    start_time = time.time()
    
    # Create semaphore to limit concurrent requests to avoid overwhelming ESPN API
    semaphore = asyncio.Semaphore(10)  # Allow up to 10 concurrent requests
    
    try:
        # Create session with connection pooling
        connector = aiohttp.TCPConnector(limit=30, limit_per_host=10)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            # Create tasks for all teams
            tasks = []
            for team_abbr, team_id in ESPN_TEAM_IDS.items():
                task = fetch_team_roster(session, team_abbr, team_id, semaphore)
                tasks.append(task)
            
            # Execute all requests concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results from all teams
            for result in results:
                if isinstance(result, dict):
                    bio_data.update(result)
        
        elapsed_time = time.time() - start_time
        print(f"Fetched ESPN bio data in {elapsed_time:.2f}s ({len(bio_data)} players)")
        
        return bio_data
        
    except Exception as e:
        print(f"Error in async bio data fetch: {e}")
        return {}

def fetch_player_bio_data(bio_cache):
    """Wrapper to run async bio data fetching"""
    current_time = time.time()
    
    # Check in-memory cache first
    if bio_cache['data'] and (current_time - bio_cache['timestamp']) < bio_cache['duration']:
        return bio_cache['data']
    
    # Try loading from file cache
    if load_cache_from_file(BIO_CACHE_FILE, bio_cache):
        return bio_cache['data']
    
    try:
        # Run async function in event loop
        bio_data = asyncio.run(fetch_player_bio_data_async())
        
        # Cache the results in memory and file
        bio_cache['data'] = bio_data
        bio_cache['timestamp'] = current_time
        save_cache_to_file(BIO_CACHE_FILE, bio_cache)
        
        return bio_data
        
    except Exception as e:
        print(f"Error fetching bio data: {e}")
        return {}

def get_season_info():
    """
    Dynamically determine the current NBA season for fantasy rankings.
    NBA seasons run from October to June, so:
    - If current month is June-September: use current year as end of previous season
    - If current month is October-May: use current year as end of current season
    """
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    if current_month >= 10:  # October-December: new season has started
        # Fantasy rankings using current season stats
        current_season = f"{current_year}-{str(current_year + 1)[2:]}"
        stats_season = f"{current_year}-{str(current_year + 1)[2:]}"
    elif current_month <= 6:  # January-June: season is ongoing
        # Fantasy rankings using current season stats
        current_season = f"{current_year - 1}-{str(current_year)[2:]}"
        stats_season = f"{current_year - 1}-{str(current_year)[2:]}"
    else:  # July-September: offseason
        # Fantasy rankings using previous completed season stats
        current_season = f"{current_year - 1}-{str(current_year)[2:]}"
        stats_season = f"{current_year - 1}-{str(current_year)[2:]}"
    
    return {
        "current_season": current_season,
        "stats_season": stats_season,
        "description": f"Fantasy rankings for {current_season} season"
    }

def get_last_season_info():
    """Get the previous season's information for historical rankings"""
    current_season_info = get_season_info()
    current_stats_season = current_season_info["stats_season"]
    
    # Parse the current season to get the previous one
    # Format is "YYYY-YY" (e.g., "2023-24")
    start_year = int(current_stats_season.split('-')[0])
    
    # Previous season
    prev_start_year = start_year - 1
    prev_end_year_short = str(start_year)[2:]  # Last 2 digits of current start year
    
    prev_stats_season = f"{prev_start_year}-{prev_end_year_short}"
    
    return {
        "stats_season": prev_stats_season,
        "description": f"Historical fantasy rankings for {prev_stats_season} season"
    }

def fetch_and_cache_players(cache, injury_cache, bio_cache, season=None):
    """Fetch player data from NBA API and store in cache"""
    if not NBA_API_AVAILABLE:
        print("NBA API not available, skipping pre-fetch")
        return None
    
    try:
        # Use provided season or get current season info
        if season:
            stats_season = season
            season_info = {"stats_season": season}
        else:
            season_info = get_season_info()
            stats_season = season_info["stats_season"]
        
        nba_start_time = time.time()
        
        # Fetch player stats for the determined season
        player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=stats_season,
            season_type_all_star='Regular Season',
            timeout=30  # Add timeout to prevent hanging
        )
        
        player_stats_data = player_stats.get_data_frames()[0].to_dict(orient='records')
        
        # Fetch injury data
        injury_data = fetch_injury_data(injury_cache)
        
        # Fetch bio data
        bio_data = fetch_player_bio_data(bio_cache)
        
        # Process players
        players = []
        for player in player_stats_data:
            if player.get('GP', 0) > 0:
                player_name = player.get('PLAYER_NAME')
                
                # Get injury information for this player
                injury_info = injury_data.get(player_name, {})
                injury_status = injury_info.get('status', 'Healthy')
                injury_type = injury_info.get('injury', None)
                injury_timeline = injury_info.get('timeline', None)
                
                # Get bio information for this player
                # Try exact match first, then normalized name
                bio_info = bio_data.get(player_name, {})
                if not bio_info:
                    normalized_nba_name = normalize_name(player_name)
                    bio_info = bio_data.get(normalized_nba_name, {})
                
                position = bio_info.get('position', '')
                height = bio_info.get('height', '')
                weight = bio_info.get('weight', '')
                jersey = bio_info.get('jersey', '')
                age = bio_info.get('age', '')
                birthdate = bio_info.get('birthdate', '')
                birthplace = bio_info.get('birthplace', '')
                college = bio_info.get('college', '')
                
                players.append({
                    'player_id': player.get('PLAYER_ID'),
                    'name': player_name,
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
                    'turnovers': player.get('TOV'),
                    'injury_status': injury_status,
                    'injury_type': injury_type,
                    'injury_timeline': injury_timeline,
                    'position': position,
                    'height': height,
                    'weight': weight,
                    'jersey': jersey,
                    'age': age,
                    'birthdate': birthdate,
                    'birthplace': birthplace,
                    'college': college
                })
        
        # Store in cache
        result_data = {
            'players': players,
            'total_count': len(players),
            'stats_season': stats_season,
            'description': season_info.get("description", f"Fantasy rankings for {stats_season} season")
        }
        
        # Add current_season if available
        if "current_season" in season_info:
            result_data['current_season'] = season_info["current_season"]
        
        cache['data'] = result_data
        cache['timestamp'] = time.time()
        
        nba_elapsed = time.time() - nba_start_time
        print(f"Fetched NBA player data in {nba_elapsed:.2f}s ({len(players)} players)")
        
        return cache['data']
        
    except Exception as e:
        return None