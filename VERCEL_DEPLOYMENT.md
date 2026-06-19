# Vercel Deployment Guide

This guide explains how to deploy the ProjectHub application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)
3. A MySQL database (see Database Options below)

## Database Options

Since Vercel doesn't provide MySQL hosting, you'll need an external database:

### Option 1: Railway (Recommended - Free Tier Available)
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add MySQL database
4. Copy the `DATABASE_URL` connection string

### Option 2: PlanetScale (Free Tier Available)
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get the connection string

### Option 3: Aiven (Free Trial)
1. Go to [aiven.io](https://aiven.io)
2. Create MySQL service
3. Get the connection string

### Option 4: AWS RDS, Azure Database, or Google Cloud SQL
Use any managed MySQL service you prefer.

## Deployment Steps

### Step 1: Deploy Backend

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables** (via Vercel Dashboard or CLI)
   
   Go to your project in Vercel Dashboard → Settings → Environment Variables, and add:
   
   ```
   DATABASE_URL=your_mysql_connection_string
   JWT_SECRET=your_random_secret_key_here_minimum_32_characters
   JWT_EXPIRES_IN=7d
   PORT=3000
   CORS_ORIGIN=*
   NODE_ENV=production
   ```

   Or use CLI:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add CORS_ORIGIN production
   ```

6. **Run Database Migrations**
   
   After setting environment variables, you need to run migrations. You can do this locally:
   ```bash
   # Set your production DATABASE_URL locally temporarily
   npx prisma migrate deploy
   npx prisma db seed  # Optional: to add demo users
   ```

7. **Note your Backend URL**
   - It will be something like: `https://your-backend.vercel.app`

### Step 2: Deploy Frontend

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Update Environment Variable**
   
   Create or update `.env.production`:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variable in Vercel Dashboard**
   
   Go to your frontend project → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

5. **Note your Frontend URL**
   - It will be something like: `https://your-frontend.vercel.app`

### Step 3: Update CORS Settings

1. Go back to your **backend** project in Vercel Dashboard
2. Update the `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
3. Redeploy the backend for changes to take effect

## Alternative: Deploy via GitHub (Recommended)

Instead of using CLI, you can connect your GitHub repository:

### Backend Deployment via GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository: `ashwin-karthik-dev/projecthub`
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build && npx prisma generate`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables (see Step 1.5 above)
5. Deploy

### Frontend Deployment via GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```
5. Deploy

## Post-Deployment

### Test Your Deployment

1. Visit your frontend URL
2. Try to register a new user
3. Login with demo credentials (if you seeded the database):
   - Member: `demo@example.com` / `Demo@1234`
   - Admin: `admin@example.com` / `Admin@1234`

### Monitor Your Application

- Check Vercel Logs for any errors
- Monitor database connections
- Test all CRUD operations

## Troubleshooting

### Issue: "Cannot connect to database"
- Verify `DATABASE_URL` is correct
- Check if your database allows connections from Vercel IPs
- Ensure database is running

### Issue: "CORS errors"
- Update `CORS_ORIGIN` to include your frontend URL
- Redeploy backend after updating environment variables

### Issue: "Prisma Client Not Found"
- Make sure build command includes: `npx prisma generate`
- Redeploy the application

### Issue: "Database tables don't exist"
- Run `npx prisma migrate deploy` with your production DATABASE_URL
- Or use Prisma Studio to verify schema

## Important Notes

⚠️ **Security Considerations:**

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Whitelist CORS origins** - Don't use `*` in production if possible
4. **Secure your database** - Use SSL connections and strong passwords
5. **Rate limiting** - The app has rate limiting configured (120 req/min globally, 5 req/min for login)

## Connecting Custom Domain (Optional)

1. Go to your Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update `CORS_ORIGIN` and `VITE_API_URL` accordingly

## Costs

- **Vercel**: Free tier includes:
  - 100 GB bandwidth
  - Unlimited deployments
  - Automatic SSL
  
- **Database**: Depends on your provider
  - Railway: Free tier with 500 hours/month
  - PlanetScale: Free tier with 5GB storage
  - Other providers: Check their pricing

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Verify database connection
4. Check the [Vercel documentation](https://vercel.com/docs)

---

**Your deployment URLs:**
- Frontend: `https://your-frontend.vercel.app`
- Backend API: `https://your-backend.vercel.app/api`
- API Docs: `https://your-backend.vercel.app/api/docs`
