# PostgreSQL Database Implementation
# Currently commented out - no PostgreSQL server available
# Uncomment when database server is set up

# import psycopg2
# import psycopg2.extras
# import os
# from contextlib import contextmanager
# import time

# Database configuration
# DB_CONFIG = {
#     'host': os.getenv('DB_HOST', 'localhost'),
#     'database': os.getenv('DB_NAME', 'fantasy_basketball'),
#     'user': os.getenv('DB_USER', 'postgres'),
#     'password': os.getenv('DB_PASSWORD', 'password'),
#     'port': os.getenv('DB_PORT', '5432')
# }

# def get_db_connection():
#     """Get a database connection"""
#     try:
#         conn = psycopg2.connect(**DB_CONFIG)
#         return conn
#     except psycopg2.Error as e:
#         print(f"Database connection error: {e}")
#         return None

# @contextmanager
# def get_db_cursor():
#     """Context manager for database operations"""
#     conn = get_db_connection()
#     if conn is None:
#         yield None
#         return
#     
#     try:
#         cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
#         yield cursor
#         conn.commit()
#     except Exception as e:
#         conn.rollback()
#         print(f"Database operation error: {e}")
#         raise
#     finally:
#         cursor.close()
#         conn.close()

# def init_database():
#     """Initialize database tables"""
#     with get_db_cursor() as cursor:
#         if cursor is None:
#             print("Could not connect to database")
#             return False
#             
#         # Create players table with season support
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS players (
#                 id SERIAL PRIMARY KEY,
#                 player_id INTEGER,
#                 season VARCHAR(10),
#                 name VARCHAR(100) NOT NULL,
#                 team VARCHAR(3),
#                 position VARCHAR(10),
#                 games_played INTEGER,
#                 minutes INTEGER,
#                 points INTEGER,
#                 rebounds INTEGER,
#                 assists INTEGER,
#                 steals INTEGER,
#                 blocks INTEGER,
#                 fgm INTEGER,
#                 fg3m INTEGER,
#                 ftm INTEGER,
#                 fg_pct DECIMAL(5,3),
#                 fg3_pct DECIMAL(5,3),
#                 ft_pct DECIMAL(5,3),
#                 turnovers INTEGER,
#                 fantasy_value DECIMAL(8,2),
#                 injury_status VARCHAR(50),
#                 injury_type VARCHAR(100),
#                 injury_timeline VARCHAR(100),
#                 height VARCHAR(10),
#                 weight VARCHAR(10),
#                 jersey VARCHAR(5),
#                 age VARCHAR(5),
#                 birthdate VARCHAR(20),
#                 birthplace VARCHAR(200),
#                 college VARCHAR(100),
#                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                 UNIQUE(player_id, season)
#             )
#         """)
#         
#         # Create game logs table for historical data
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS game_logs (
#                 id SERIAL PRIMARY KEY,
#                 player_id INTEGER,
#                 season VARCHAR(10),
#                 game_date DATE,
#                 opponent VARCHAR(3),
#                 points INTEGER,
#                 rebounds INTEGER,
#                 assists INTEGER,
#                 steals INTEGER,
#                 blocks INTEGER,
#                 fg_pct DECIMAL(5,3),
#                 fg3_pct DECIMAL(5,3),
#                 ft_pct DECIMAL(5,3),
#                 turnovers INTEGER,
#                 minutes INTEGER,
#                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#             )
#         """)
#         
#         # Create indexes for better performance
#         cursor.execute("""
#             CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
#             CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
#             CREATE INDEX IF NOT EXISTS idx_players_season ON players(season);
#             CREATE INDEX IF NOT EXISTS idx_players_fantasy_value ON players(fantasy_value DESC);
#             CREATE INDEX IF NOT EXISTS idx_players_updated_at ON players(updated_at);
#             CREATE INDEX IF NOT EXISTS idx_players_season_fantasy ON players(season, fantasy_value DESC);
#             CREATE INDEX IF NOT EXISTS idx_game_logs_player_date ON game_logs(player_id, game_date);
#         """)
#         
#         print("Database tables initialized successfully")
#         return True

# def save_players_to_db(players_data, season):
#     """Save players data to database for a specific season"""
#     if not players_data:
#         return False
#         
#     start_time = time.time()
#     
#     with get_db_cursor() as cursor:
#         if cursor is None:
#             return False
#             
#         for player in players_data:
#             cursor.execute("""
#                 INSERT INTO players (
#                     player_id, season, name, team, position, games_played, minutes,
#                     points, rebounds, assists, steals, blocks, fgm, fg3m, ftm,
#                     fg_pct, fg3_pct, ft_pct, turnovers, fantasy_value,
#                     injury_status, injury_type, injury_timeline,
#                     height, weight, jersey, age, birthdate, birthplace, college,
#                     updated_at
#                 ) VALUES (
#                     %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
#                     %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
#                     CURRENT_TIMESTAMP
#                 )
#                 ON CONFLICT (player_id, season) DO UPDATE SET
#                     name = EXCLUDED.name,
#                     team = EXCLUDED.team,
#                     position = EXCLUDED.position,
#                     games_played = EXCLUDED.games_played,
#                     minutes = EXCLUDED.minutes,
#                     points = EXCLUDED.points,
#                     rebounds = EXCLUDED.rebounds,
#                     assists = EXCLUDED.assists,
#                     steals = EXCLUDED.steals,
#                     blocks = EXCLUDED.blocks,
#                     fgm = EXCLUDED.fgm,
#                     fg3m = EXCLUDED.fg3m,
#                     ftm = EXCLUDED.ftm,
#                     fg_pct = EXCLUDED.fg_pct,
#                     fg3_pct = EXCLUDED.fg3_pct,
#                     ft_pct = EXCLUDED.ft_pct,
#                     turnovers = EXCLUDED.turnovers,
#                     fantasy_value = EXCLUDED.fantasy_value,
#                     injury_status = EXCLUDED.injury_status,
#                     injury_type = EXCLUDED.injury_type,
#                     injury_timeline = EXCLUDED.injury_timeline,
#                     height = EXCLUDED.height,
#                     weight = EXCLUDED.weight,
#                     jersey = EXCLUDED.jersey,
#                     age = EXCLUDED.age,
#                     birthdate = EXCLUDED.birthdate,
#                     birthplace = EXCLUDED.birthplace,
#                     college = EXCLUDED.college,
#                     updated_at = CURRENT_TIMESTAMP
#             """, (
#                 player.get('player_id'),
#                 season,
#                 player.get('name'),
#                 player.get('team'),
#                 player.get('position'),
#                 player.get('games_played'),
#                 player.get('minutes'),
#                 player.get('points'),
#                 player.get('rebounds'),
#                 player.get('assists'),
#                 player.get('steals'),
#                 player.get('blocks'),
#                 player.get('fgm'),
#                 player.get('fg3m'),
#                 player.get('ftm'),
#                 player.get('fg_pct'),
#                 player.get('fg3_pct'),
#                 player.get('ft_pct'),
#                 player.get('turnovers'),
#                 player.get('fantasyValue'),
#                 player.get('injury_status'),
#                 player.get('injury_type'),
#                 player.get('injury_timeline'),
#                 player.get('height'),
#                 player.get('weight'),
#                 player.get('jersey'),
#                 player.get('age'),
#                 player.get('birthdate'),
#                 player.get('birthplace'),
#                 player.get('college')
#             ))
#     
#     elapsed_time = time.time() - start_time
#     print(f"Saved {len(players_data)} players to database for season {season} in {elapsed_time:.2f}s")
#     return True

# def get_players_from_db(season):
#     """Get all players from database for a specific season"""
#     with get_db_cursor() as cursor:
#         if cursor is None:
#             return []
#             
#         cursor.execute("""
#             SELECT * FROM players 
#             WHERE season = %s
#             ORDER BY fantasy_value DESC NULLS LAST
#         """, (season,))
#         
#         rows = cursor.fetchall()
#         
#         # Convert to the format expected by frontend
#         players = []
#         for row in rows:
#             player = dict(row)
#             # Map database fields to frontend expected format
#             player['fantasyValue'] = player.get('fantasy_value')
#             players.append(player)
#             
#         return players

# def check_data_freshness(season):
#     """Check if data needs updating for a specific season (older than 1 hour for current, 24 hours for historical)"""
#     with get_db_cursor() as cursor:
#         if cursor is None:
#             return True  # Assume needs update if can't check
#             
#         cursor.execute("""
#             SELECT MAX(updated_at) as last_update, COUNT(*) as player_count
#             FROM players
#             WHERE season = %s
#         """, (season,))
#         
#         result = cursor.fetchone()
#         if not result or not result['last_update'] or result['player_count'] == 0:
#             return True  # No data, needs update
#             
#         # Check if data is older than threshold
#         cursor.execute("""
#             SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - %s)) as age_seconds
#         """, (result['last_update'],))
#         
#         age_result = cursor.fetchone()
#         age_hours = age_result['age_seconds'] / 3600 if age_result else 999
#         
#         # Current season: update every hour, historical seasons: update daily
#         from datetime import datetime
#         current_year = datetime.now().year
#         is_current_season = str(current_year) in season or str(current_year-1) in season
#         
#         threshold = 1 if is_current_season else 24
#         return age_hours > threshold

# def get_season_stats():
#     """Get statistics about data in database"""
#     with get_db_cursor() as cursor:
#         if cursor is None:
#             return {}
#             
#         cursor.execute("""
#             SELECT 
#                 season,
#                 COUNT(*) as player_count,
#                 MAX(updated_at) as last_update
#             FROM players 
#             GROUP BY season 
#             ORDER BY season DESC
#         """)
#         
#         rows = cursor.fetchall()
#         return [dict(row) for row in rows]