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