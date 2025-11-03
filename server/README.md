# TODO List Backend Server

Express.js backend API for the TODO list application with user authentication and task management.

## Features

- 🔐 User authentication (signup/login with JWT)
- ✅ Task CRUD operations
- 🔄 Recurring tasks support
- 🔒 Security: Helmet, rate limiting, CORS
- 🌍 Environment-based configuration

## Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your settings:**
   - Generate a strong SECRET_KEY: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Update ALLOWED_ORIGINS with your frontend URL

4. **Start the server:**
   ```bash
   npm run dev  # Development with nodemon
   npm start    # Production
   ```

5. **Server runs on:** `http://localhost:3000`

## Deployment

### Option 1: Railway (Recommended - Free tier available)

1. **Create Railway account:** https://railway.app
2. **Create new project → Deploy from GitHub**
3. **Add environment variables in Railway dashboard:**
   - `PORT` (Railway provides this automatically)
   - `SECRET_KEY` (generate with crypto command above)
   - `ALLOWED_ORIGINS` (your frontend URL)
   - `NODE_ENV=production`
4. **Railway auto-deploys on git push**

### Option 2: Render (Free tier with limitations)

1. **Create Render account:** https://render.com
2. **New Web Service → Connect repository**
3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables in dashboard
4. **Deploy**

### Option 3: Heroku

1. **Install Heroku CLI**
2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. **Set environment variables:**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set ALLOWED_ORIGINS=https://your-frontend.netlify.app
   heroku config:set NODE_ENV=production
   ```
4. **Deploy:**
   ```bash
   git push heroku main
   ```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `SECRET_KEY` | JWT signing key | 64-char hex string |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://app.netlify.app` |
| `NODE_ENV` | Environment | `production` |

## API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - Login user

### Tasks (requires JWT token)
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Security Features

- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 req/15min general, 5 req/15min for auth)
- ✅ CORS with origin whitelist
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Environment-based secrets

## Data Storage

- Uses JSON files for simplicity (`data/users.json`, `data/tasks.json`)
- Perfect for small-scale deployments
- Automatically creates data directory on startup
- **Note:** For production at scale, consider upgrading to PostgreSQL/MongoDB

## Troubleshooting

**CORS errors:** 
- Add your frontend URL to `ALLOWED_ORIGINS` in .env

**Authentication fails:**
- Verify `SECRET_KEY` is set and matches across deployments

**Server won't start:**
- Check PORT is available
- Verify all dependencies installed: `npm install`

## Production Checklist

- [ ] Set strong `SECRET_KEY` (64-char hex)
- [ ] Update `ALLOWED_ORIGINS` with production frontend URL
- [ ] Set `NODE_ENV=production`
- [ ] Test all endpoints with production URLs
- [ ] Monitor rate limiting logs
- [ ] Set up error monitoring (optional: Sentry, etc.)

## License

ISC
