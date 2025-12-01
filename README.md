# Portfolio Backend - MongoDB Migration

This project now supports **MongoDB** for persistent data storage, making it deployable to Netlify and other serverless platforms.

## 🚀 Quick Start

### Local Development (JSON File)
```bash
npm install
npm run dev
```
Your portfolio will run on `http://localhost:3000` using the local JSON file for storage.

### Local Development (MongoDB)
1. Create a `.env` file:
   ```
   MONGODB_URI=your_mongodb_connection_string
   USE_MONGODB=true
   ```
2. Seed the database:
   ```bash
   npm run seed
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## 📦 Project Structure

```
Portfolio-webpage/
├── config/
│   └── db.js                 # MongoDB connection utility
├── models/
│   └── Content.js            # Mongoose schema for content
├── netlify/
│   └── functions/
│       └── api.js            # Serverless function for Netlify
├── scripts/
│   └── seed-db.js            # Script to seed MongoDB
├── data/
│   └── content.json          # Local content storage
├── server.js                 # Express server (supports both MongoDB & JSON)
├── netlify.toml              # Netlify configuration
├── .env.example              # Environment variables template
└── .agent/
    └── workflows/
        └── deploy-netlify.md # Deployment guide
```

## 🌐 Deployment

To deploy to Netlify with MongoDB:

1. **Set up MongoDB Atlas** (free tier)
2. **Create `.env` file** with your MongoDB connection string
3. **Seed your database**: `npm run seed`
4. **Push to GitHub**
5. **Deploy on Netlify** and add `MONGODB_URI` environment variable

For detailed step-by-step instructions, see the deployment workflow:
```bash
# View the deployment guide
cat .agent/workflows/deploy-netlify.md
```

Or use the slash command: `/deploy-netlify`

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes (for production) |
| `USE_MONGODB` | Enable MongoDB in local dev | No (defaults to false) |
| `PORT` | Server port | No (defaults to 3000) |

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run seed` - Seed MongoDB with content from JSON file

## 🎨 Features

- ✅ Dual storage support (MongoDB + JSON file)
- ✅ Automatic database seeding
- ✅ Serverless-ready (Netlify Functions)
- ✅ Admin panel for content management
- ✅ RESTful API for all content sections
- ✅ CORS enabled for frontend access

## 🔐 Security Notes

- Never commit `.env` file (already in `.gitignore`)
- Use strong passwords for MongoDB users
- Whitelist specific IPs in production (currently set to `0.0.0.0/0` for Netlify)

## 📚 API Endpoints

All endpoints are available at `/api/*`:

- `GET /api/content` - Get all content
- `PUT /api/content` - Update all content
- `GET /api/sections/:section` - Get specific section
- `PUT /api/sections/:section` - Update specific section
- `POST /api/sections/:section` - Add item to array section
- `PUT /api/sections/:section/:index` - Update item in array section
- `DELETE /api/sections/:section/:index` - Delete item from array section

## 🆘 Troubleshooting

**Database connection fails:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

**Netlify functions not working:**
- Check function logs in Netlify dashboard
- Verify environment variables are set
- Ensure `netlify.toml` is properly configured

**Admin panel can't save:**
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure CORS is properly configured

## 📄 License

ISC
