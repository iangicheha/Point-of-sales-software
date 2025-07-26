# POS Belmont Hotel

A comprehensive Point of Sale system for Belmont Hotel with restaurant management, room booking, and inventory tracking.

## 🚀 Quick Start

### Local Development

**Option 1: Using the provided scripts (Recommended)**
```bash
# Windows (Command Prompt)
start-local.bat

# Windows (PowerShell)
.\start-local.ps1
```

**Option 2: Manual start**
```bash
# Terminal 1 - Start Backend
cd backend
npm install
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm install
npm start
```

### Vercel Deployment (For Demo)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

## 📁 Project Structure

```
├── backend/          # Node.js/Express API
├── frontend/         # React TypeScript App
├── docs/            # Documentation
├── start-local.bat  # Windows batch script for local development
├── start-local.ps1  # PowerShell script for local development
└── vercel.json      # Vercel deployment configuration
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Environment Setup

1. **Backend Environment Variables** (create `backend/.env`):
```env
DATABASE_URL=postgresql://username:password@localhost:5432/pos_db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

2. **Frontend Environment Variables** (create `frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
```

### Database Setup
1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your backend `.env` file
3. The database tables will be created automatically on first run

## 🌐 Vercel Deployment

For temporary deployment to show your friend:

1. **Set up a PostgreSQL database** (Railway, Supabase, or Neon)
2. **Deploy to Vercel**:
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
3. **Configure environment variables** in Vercel dashboard
4. **Test the deployment**

## 📊 Features

- **Restaurant Management**: Menu items, orders, payments
- **Room Management**: Booking, check-in/out, room services
- **Inventory Management**: Stock tracking, purchase orders
- **User Management**: Staff accounts and permissions
- **Reports**: Sales analytics and business insights
- **Payment Integration**: Cash and M-Pesa payments

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, TypeORM, PostgreSQL
- **Frontend**: React, TypeScript, Material-UI, Chart.js
- **Authentication**: JWT tokens
- **Payment**: M-Pesa integration
- **Deployment**: Vercel (frontend + backend)

## 🔍 Troubleshooting

### Local Development Issues

1. **Port already in use**:
   ```bash
   # Find and kill the process
   netstat -ano | findstr :5000
   taskkill /PID <process_id>
   ```

2. **Database connection issues**:
   - Check your `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Verify database credentials

3. **Frontend not loading**:
   - Check if backend is running on port 5000
   - Verify proxy settings in `frontend/package.json`

### Vercel Deployment Issues

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

## 📝 License

This project is for Belmont Hotel internal use.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the deployment guide
3. Check console logs for errors 