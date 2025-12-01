# Crossing Moderation Bot

Discord moderation bot with a point system, embeds, DM notifications, and auto-ban at 30 points.

## Features

- Slash commands: `/warn`, `/mute`, `/kick`, `/ban`, `/purge`
- Point system: warn = 1, mute = 3, kick = 5, ban sets to 30
- Auto-ban at 30 points
- DM the user with details and current points
- Log embeds to the Disciplinary Action log channel (ID: 1415110426961641574)
- Commands require appropriate Discord permissions; you can further restrict via role checks if needed

## Setup

1. Install Node.js 18+
2. Create `.env` based on `.env.example` and fill in `DISCORD_TOKEN` and `CLIENT_ID` (and `GUILD_ID` for fast dev updates)
3. Install dependencies:

```
npm install
```

4. Register slash commands (guild recommended for development):

```
# Guild registration (fast updates)
set GUILD_ID=YOUR_GUILD_ID && npm run register

# Or global registration (may take up to an hour to appear)
npm run register
```

5. Start the bot:

```
npm run start
```

## Data Persistence

- User points are stored in `data/points.json` (created automatically). Consider moving to a database for production use.

## Configuration

- Role IDs and log channel are configured in `src/config.js`:
  - Staff Role: 1415103793036529726
  - Admin Role: 1415103614455644252
  - DA Log Channel: 1415110426961641574
  - Ban threshold: 30 points

