# StatLine Fantasy: NBA Fantasy Basketball Rankings

A full-stack web application that provides real-time NBA player rankings using a custom fantasy scoring algorithm. Built with Flask, JavaScript, and integrates the NBA and ESPN API to deliver comprehensive player statistics, injury reports, and biographical data.

## About

This project is designed for fantasy basketball users and ranks NBA players using a custom algorithm that calculates each player's "fantasy value." The algorithm considers stats, age, games played, and injury status to help managers make better drafting and trading decisions across different teams and positions. All player rankings are for the upcoming season using the previous season's stats (e.g 2024-2025 stats for 2025-2026 rankings).

Real-time injury data ensures that rankings reflect current player availability, which is crucial for fantasy success. The system automatically takes into accounts for factors such as games played and player age, providing a more in-depth evaluation than simple per-game stats.

While these rankings are designed to serve as a valuable analytical tool, *by no means is this a true ranking* as basketball involves many factors that an algorithm cannot capture. The rankings are best used as a starting point for fantasy decisions, combined with your own basketball knowledge and intuition.

## Features

- **Custom Fantasy Algorithm**: Scoring system that weights different statistics (3PM=3pts, STL=3pts, BLK=3pts, etc.)
- **Real-Time Data**: Live NBA statistics from official NBA API
- **Injury Tracking**: Current injury status and return timelines from ESPN
- **Advanced Filtering**: Filter by team, position, injury status, and stats
- **Season Comparison**: Compare current vs previous season rankings
- **Performance Optimized**: Smart caching system reduces load times from 30s to <1s

## Technology Stack

### Backend
- **Python 3.8+**
- **Flask** - REST API server
- **aiohttp** - Asynchronous HTTP requests
- **NBA API** - Official NBA statistics
- **ESPN API** - Injury reports and player biographical data

### Frontend
- **Vanilla JavaScript**
- **HTML5/CSS3**

## Quick Start

### Prerequisites
```bash
pip install flask flask-cors nba-api aiohttp requests
```

### Installation
1. Clone the repository
```bash
git clone <repository-url>
cd nba-fantasy-rankings
```

2. Start the backend server
```bash
cd backend
python3 app.py
```

3. Open the frontend
```bash
# Open frontend/index.html in your browser
# Or serve it locally:
cd frontend
python3 -m http.server 8000
```

4. Access the application at `http://localhost:8000`

Or: Just go to `https://statlinefantasy.com`

## API Endpoints

- `GET /api/health` - Server status and season information
- `GET /api/players` - Current season player rankings
- `GET /api/players/last-season` - Previous season player data

## Project Structure

```
├── backend/
│   ├── app.py              # Flask server and API routes
│   ├── get_data.py         # Data fetching and processing
│   └── cache/              # Cached data files
├── frontend/
│   ├── index.html          # Main application page
│   ├── styles.css          # Application styling
│   └── js/
│       ├── main.js         # Application initialization
│       ├── api.js          # API communication
│       ├── ui.js           # UI rendering and interactions
│       └── fantasy_algorithm.js  # Custom scoring algorithm
└── README.md
```

## Fantasy Scoring Algorithm

The custom algorithm evaluates players based on:

**Statistical Weights:**
- 3-Point Makes = 3 points
- 2-Point Makes = 2 points  
- Free Throw Makes = 1 point
- Rebounds = 1.2 points
- Assists = 1.5 points
- Steals = 2 points
- Blocks = 2 points
- Turnovers = -1.5 points

**Additional Factors:**
- **Efficiency Metrics**: True shooting percentage, turnover impact
- **Availability Factor**: Games played multiplier (up to 1.07x for 70+ games)
- **Age Adjustment**: Slight boost for younger players with potential

## Performance Features

- **Concurrent API Requests**: Fetches data from multiple sources simultaneously
- **Multi-Tier Caching**: In-memory and file-based caching
- **Smart Data Processing**: Optimized player matching and normalization
- **Load Time**: ~0.07 seconds with cache, ~1.2 seconds fresh fetch for 500+ players

## Data Sources

- **NBA Official API**: Player statistics and season data
- **ESPN API**: Injury reports, player bios, and team information
- **Real-time Updates**: Injury status and player availability

## Development

### Adding New Features
The modular architecture makes it easy to extend:
- Add new scoring factors in `fantasy_algorithm.js`
- Create new API endpoints in `app.py`
- Extend filtering options in `ui.js`

### Local Development
```bash
# Backend with auto-reload
cd backend
python3 app.py

# Frontend development server
cd frontend
python3 -m http.server 8000