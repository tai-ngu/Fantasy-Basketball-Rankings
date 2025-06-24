# Database Setup Instructions

## Local Development

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE fantasy_basketball;
CREATE USER fantasy_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE fantasy_basketball TO fantasy_user;
\q
```

### 3. Update Environment Variables

Update `.env` file with your database credentials:
```
DB_HOST=localhost
DB_NAME=fantasy_basketball
DB_USER=fantasy_user
DB_PASSWORD=password123
DB_PORT=5432
```

### 4. Test Connection

```bash
cd backend
python3 -c "from database import get_db_connection; print('Connection:', 'Success' if get_db_connection() else 'Failed')"
```

## Production Deployment (Railway/Heroku)

### Railway
1. Add PostgreSQL plugin in Railway dashboard
2. Railway will automatically provide `DATABASE_URL` environment variable
3. No additional setup needed - the app will use the provided database

### Heroku
1. Add Heroku Postgres addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```
2. Heroku automatically sets `DATABASE_URL`
3. Deploy normally

## Features Added

✅ **Persistent Storage** - Data survives server restarts
✅ **Performance** - Database queries are faster than API calls
✅ **Scalability** - Can handle multiple users and historical data
✅ **Data Integrity** - ACID compliance and data validation
✅ **Advanced Queries** - Complex filtering and analytics capabilities

## Benefits

1. **Instant Loading** - Website loads from database (sub-second) instead of waiting for API calls
2. **Reliability** - Data persists even if NBA API is down
3. **Historical Tracking** - Can store game logs and player performance over time
4. **User Features** - Can add user accounts, saved teams, watchlists
5. **Analytics** - Complex queries for trends and insights