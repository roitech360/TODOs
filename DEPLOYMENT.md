# TODO List Frontend - Deployment Guide

## Quick Deploy to Netlify (Recommended)

### Option 1: Drag & Drop (Easiest)

1. **Build your production files:**
   - Your app is already production-ready (no build step needed)
   - Ensure all files are in the project root

2. **Deploy to Netlify:**
   - Go to https://app.netlify.com/drop
   - Drag your project folder (or just the files: index.html, login.html, css/, js/, etc.)
   - Netlify assigns you a URL like: `https://random-name.netlify.app`

3. **Update backend CORS:**
   - Copy your Netlify URL
   - Update backend `.env` file: `ALLOWED_ORIGINS=https://your-url.netlify.app`
   - Redeploy backend with new CORS settings

4. **Update frontend config:**
   - Open `js/config.js`
   - Update the production URL in `getApiUrl()` function
   - Redeploy frontend to Netlify

### Option 2: GitHub Deploy (Continuous Deployment)

1. **Push to GitHub** (if not already done)

2. **Connect to Netlify:**
   - Login to https://netlify.com
   - New Site from Git → GitHub
   - Select your repository
   - Build settings:
     - Build command: (leave empty)
     - Publish directory: `.` (root)
   - Deploy

3. **Get your URL** and update backend CORS (see Option 1, step 3-4)

## Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd path/to/TODO_list
   vercel
   ```

3. **Follow prompts:**
   - Set up and deploy: Y
   - Scope: your account
   - Link to existing project: N
   - Project name: todo-list
   - Directory: `./`
   - Settings: N (defaults are fine)

4. **Update URLs** (see Netlify Option 1, steps 3-4)

## Configuration Steps After Deployment

### 1. Update Backend CORS Settings

In your backend `.env` file:
```bash
ALLOWED_ORIGINS=https://your-frontend.netlify.app,http://localhost:5502
```

### 2. Update Frontend API URL

Edit `js/config.js`:
```javascript
function getApiUrl() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    
    // Update this with your deployed backend URL
    return 'https://your-backend.railway.app/api';
}
```

### 3. Test Your Deployment

1. Visit your frontend URL
2. Try registering a new user
3. Create some tasks
4. Verify all features work

## Deployment Checklist

- [ ] Backend deployed and running
- [ ] Backend CORS includes frontend URL
- [ ] Frontend config.js has correct backend URL
- [ ] Frontend deployed to Netlify/Vercel
- [ ] Test signup/login works
- [ ] Test creating tasks
- [ ] Test task updates/deletions
- [ ] Test recurring tasks

## Files Structure

```
TODO_list/
├── index.html          ← Main app page
├── login.html          ← Login/signup page
├── css/
│   └── style.css      ← Styles
├── js/
│   ├── config.js      ← API URL configuration ✨
│   ├── auth.js        ← Authentication
│   ├── tasks.js       ← Task management
│   └── login.js       ← Login logic
└── server/            ← Backend (deploy separately)
```

## Troubleshooting

**CORS errors:**
- Check backend ALLOWED_ORIGINS includes your frontend URL
- Verify no trailing slashes in URLs

**Login not working:**
- Open browser console (F12) to see errors
- Check API URL in config.js is correct
- Verify backend is running

**Tasks not loading:**
- Check JWT token in localStorage (F12 → Application → Local Storage)
- Verify API endpoint URLs
- Check backend logs for errors

## Custom Domain (Optional)

### Netlify Custom Domain:
1. Netlify Dashboard → Domain Settings
2. Add custom domain
3. Follow DNS configuration steps

### Vercel Custom Domain:
1. Vercel Dashboard → Settings → Domains
2. Add domain
3. Update DNS records

## Performance Tips

- ✅ Your site is already optimized (vanilla JS, no build step)
- ✅ Netlify/Vercel provide CDN automatically
- ✅ HTTPS enabled by default

## Next Steps

1. Deploy backend first (see server/README.md)
2. Note backend URL
3. Update frontend config.js
4. Deploy frontend
5. Test everything
6. Share your app! 🎉

## Support

For issues:
- Check browser console (F12) for errors
- Check backend logs on Railway/Render
- Verify environment variables are set correctly
