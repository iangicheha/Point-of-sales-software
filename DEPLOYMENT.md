# Vercel Deployment Guide

This guide will help you deploy your POS system to Vercel with both frontend and backend.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **PostgreSQL Database**: You'll need a PostgreSQL database (recommended: Railway, Supabase, or Neon)

## Step 1: Set Up Database

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database
4. Copy the database URL

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

### Option C: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

## Step 2: Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name
   - Confirm deployment

### Method 2: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project settings

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

### Required Variables:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### Optional Variables:
```
NODE_ENV=production
PORT=3000
```

## Step 4: Deploy

1. **Push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Vercel will automatically deploy** when you push to the main branch

## Step 5: Verify Deployment

1. **Check the deployment** in your Vercel dashboard
2. **Test the API endpoints**:
   - Visit: `https://your-domain.vercel.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

3. **Test the frontend**:
   - Visit: `https://your-domain.vercel.app`
   - Should load the login page

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Check your `DATABASE_URL` environment variable
   - Ensure your database is accessible from Vercel's servers
   - Check if your database requires SSL

2. **Build Errors**:
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are properly installed
   - Check for TypeScript compilation errors

3. **API Not Working**:
   - Verify the routes are correctly configured in `vercel.json`
   - Check that the backend is properly exported
   - Test individual API endpoints

### Debug Commands:

```bash
# Check build locally
npm run build

# Test backend locally
cd backend && npm run dev

# Test frontend locally
cd frontend && npm start
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | `your-secret-key-here` |
| `FRONTEND_URL` | Your Vercel domain | Yes | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | No | `production` |
| `PORT` | Server port | No | `3000` |

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Test the application locally first
4. Check the database connection

## Next Steps

After successful deployment:

1. **Set up a custom domain** (optional)
2. **Configure SSL certificates** (automatic with Vercel)
3. **Set up monitoring** and analytics
4. **Configure backups** for your database 