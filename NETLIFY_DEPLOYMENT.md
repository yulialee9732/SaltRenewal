# Netlify Deployment Guide

## Overview

This guide explains how to deploy your MERN app on Netlify. Since Netlify is designed for static sites and frontend applications, we'll deploy:
- **Frontend (React)** → Netlify
- **Backend (Node.js/Express)** → Render, Railway, or Heroku (see backend deployment guide below)

## Prerequisites

- GitHub account
- Netlify account (free at [netlify.com](https://netlify.com))
- Your code pushed to a GitHub repository

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
cd /Users/SeungyounLee/Desktop/SaltRenewal/mern-app
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

## Step 2: Deploy Frontend on Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to [Netlify](https://app.netlify.com/)**
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select your repository
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`
5. Click **"Deploy site"**

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from client directory
cd client
netlify deploy --prod
```

## Step 3: Configure Environment Variables

After deployment, you need to set the backend API URL:

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add a new variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.com/api` (your backend URL - see Step 4)
3. Click **Save**
4. **Redeploy** your site for changes to take effect

## Step 4: Deploy Backend (Node.js/Express)

Netlify doesn't support Node.js backends. Deploy your backend separately:

### Option A: Deploy on Render (Recommended - Free tier available)

1. Go to [Render.com](https://render.com/)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables (.env variables)
6. Deploy

### Option B: Deploy on Railway

1. Go to [Railway.app](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect Node.js
5. Set root directory to `server` in settings
6. Add environment variables
7. Deploy

### Option C: Deploy on Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create a new app
cd server
heroku create your-app-name

# Set environment variables
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... add all your env variables

# Deploy
git subtree push --prefix server heroku main
```

## Step 5: Update API URL in Frontend

After deploying your backend, update the frontend to use the production backend URL:

### Method 1: Environment Variable (Recommended)

1. In Netlify dashboard → **Environment variables**
2. Add `REACT_APP_API_URL` with your backend URL
3. Redeploy

### Method 2: Update Code

Edit `client/src/services/api.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.com/api';
```

## Step 6: Test Your Deployment

1. Visit your Netlify URL (e.g., `https://your-app-name.netlify.app`)
2. Test all features:
   - Price estimate form
   - User registration/login
   - A/S requests
   - Contact forms
3. Check that data is being saved to MongoDB and Google Sheets

## Common Issues & Solutions

### Issue: "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Solution**: Your frontend can't reach the backend.
- Check that `REACT_APP_API_URL` is set correctly in Netlify
- Make sure your backend is deployed and running
- Verify CORS is configured in your backend to allow your Netlify domain

### Issue: "Module not found" errors

**Solution**: 
```bash
# Make sure all dependencies are listed in package.json
cd client
npm install
```

### Issue: Blank page after deployment

**Solution**: 
- Check browser console for errors
- Verify build completed successfully in Netlify deploy logs
- Make sure `netlify.toml` redirects are configured for React Router

### Issue: API calls fail with CORS errors

**Solution**: Update your backend CORS configuration in `server/src/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app-name.netlify.app'  // Add your Netlify domain
  ],
  credentials: true
}));
```

## Continuous Deployment

Once connected to GitHub, Netlify automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Netlify will automatically deploy!
```

## Custom Domain (Optional)

1. In Netlify dashboard → **Domain settings**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS
4. Netlify provides free SSL certificates automatically

## Backend Environment Variables Checklist

Make sure these are set in your backend deployment:

- ✅ `PORT` (usually auto-set by hosting platform)
- ✅ `MONGO_URI` (MongoDB Atlas connection string)
- ✅ `JWT_SECRET`
- ✅ `JWT_EXPIRE`
- ✅ `NODE_ENV=production`
- ✅ `EMAIL_USER` (for nodemailer)
- ✅ `EMAIL_PASSWORD` (Gmail app password)
- ✅ `GOOGLE_SPREADSHEET_ID`
- ✅ `GOOGLE_CREDENTIALS`

## Monitoring

- **Netlify**: View deploy logs and analytics in dashboard
- **Backend**: Use platform's built-in logging (Render, Railway, Heroku)
- **MongoDB Atlas**: Monitor database usage in Atlas dashboard

## Cost Summary

- **Netlify (Frontend)**: Free tier available (100GB bandwidth/month)
- **Render (Backend)**: Free tier available (sleeps after inactivity)
- **Railway (Backend)**: $5 free credit/month
- **MongoDB Atlas**: Free tier (512MB storage)
- **Total**: Can be completely FREE on free tiers!

## Support

If you encounter issues:
1. Check Netlify deploy logs
2. Check backend logs in your hosting platform
3. Check browser console for frontend errors
4. Review this guide and verify all steps were completed
