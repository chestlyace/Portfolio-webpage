---
description: Deploy backend to Netlify with MongoDB
---

# Deploy Portfolio Backend to Netlify

This workflow guides you through deploying your portfolio backend to Netlify using MongoDB Atlas for data storage.

## Prerequisites

- GitHub account
- Netlify account (free tier is fine)
- MongoDB Atlas account (free tier is fine)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account (or sign in)
3. Create a new **FREE** cluster:
   - Click "Build a Database"
   - Choose **M0 FREE** tier
   - Select a cloud provider and region (choose one close to you)
   - Click "Create Cluster"

4. **Create a Database User**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

5. **Whitelist All IP Addresses** (for Netlify):
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add `0.0.0.0/0`)
   - Click "Confirm"

6. **Get Your Connection String**:
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add `/portfolio` before the `?` to specify database name

   **Final format**: `mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority`

---

## Step 2: Create .env File Locally

Create a `.env` file in your project root:

```bash
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
USE_MONGODB=true
```

**Important**: Replace the connection string with your actual MongoDB connection string from Step 1.

---

## Step 3: Seed Your Database

Run the seed script to populate MongoDB with your existing content:

// turbo
```bash
npm run seed
```

You should see output confirming the database was seeded successfully.

---

## Step 4: Test Locally with MongoDB

Restart your dev server to use MongoDB:

```bash
npm run dev
```

- Visit `http://localhost:3000` and verify everything works
- Try editing content in the admin panel at `http://localhost:3000/admin.html`
- Changes should now be saved to MongoDB instead of the JSON file

---

## Step 5: Push to GitHub

Make sure all your changes are committed and pushed:

// turbo
```bash
git add .
git commit -m "Add MongoDB support and Netlify functions"
git push origin main
```

---

## Step 6: Deploy to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your `Portfolio-webpage` repository
5. Configure build settings:
   - **Build command**: Leave empty (or use `echo "No build needed"`)
   - **Publish directory**: `.` (current directory)
6. Click "Deploy site"

---

## Step 7: Add Environment Variables to Netlify

1. In your Netlify site dashboard, go to **Site settings** → **Environment variables**
2. Click "Add a variable"
3. Add the following variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string (from Step 1)
4. Click "Save"

---

## Step 8: Redeploy Site

After adding environment variables:

1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait for deployment to complete

---

## Step 9: Test Your Live Site

1. Once deployed, click on your site URL (e.g., `https://your-site-name.netlify.app`)
2. Verify the portfolio loads correctly
3. Test the admin panel at `https://your-site-name.netlify.app/admin.html`
4. Make a test edit and verify it saves to MongoDB

---

## Troubleshooting

### Functions not working
- Check Netlify function logs: Site settings → Functions → View logs
- Verify `MONGODB_URI` is set correctly in environment variables
- Make sure MongoDB Atlas allows connections from `0.0.0.0/0`

### Database connection errors
- Verify your MongoDB connection string is correct
- Check that your database user has read/write permissions
- Ensure IP whitelist includes `0.0.0.0/0`

### Admin panel can't save
- Open browser console (F12) and check for errors
- Verify the API endpoints are working: visit `https://your-site.netlify.app/.netlify/functions/api/api/content`

---

## Optional: Custom Domain

To add a custom domain:
1. Go to "Domain settings" in Netlify
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS

---

## Notes

- Your local development will continue to use the JSON file unless you set `USE_MONGODB=true` in `.env`
- MongoDB Atlas free tier includes 512MB storage (plenty for a portfolio)
- Netlify free tier includes 125k function requests/month
- All your content is now stored in the cloud and persists across deployments!
