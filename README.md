# ManageEasy-Full-stack

## Setup

1. Copy `.env.example` to `.env` in the project directory.
2. Set `MONGODB_URI` to your MongoDB connection string. For Render, use a hosted MongoDB URI (such as MongoDB Atlas), not `127.0.0.1`; set the real URI in the Render dashboard's Environment settings, not in a committed file. The database name must match the existing database's capitalization (the example uses `ManageEasy`).
3. Replace `JWT_SECRET` and `SESSION_SECRET` with different, randomly generated values. Keep `.env` private; it is ignored by Git.
4. Install dependencies with `npm install`, then start the app with `npm start`.

On PowerShell, copy the template with:

```powershell
Copy-Item .env.example .env
```

## Render deployment

Set these variables in the Render service's Environment settings:

- `NODE_ENV=production`
- `MONGODB_URI` to the hosted MongoDB Atlas connection string for the `ManageEasy` database. Do not use a `127.0.0.1` URI on Render.
- `SESSION_SECRET` and `JWT_SECRET` to different, randomly generated values. Never commit the actual values.

Production sessions are stored in MongoDB. The app trusts Render's HTTPS proxy so the secure session cookie is issued correctly.