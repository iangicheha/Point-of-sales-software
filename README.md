# POS Belmont Hotel

A comprehensive Point of Sale system for Belmont Hotel with restaurant management, room booking, and inventory tracking.

## Quick Start (Local Development)

1. **Start the Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Project Structure

```
├── backend/          # Node.js/Express API
├── frontend/         # React TypeScript App
├── docs/             # Documentation
```

## Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

## Environment Setup

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

## Database Setup
1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your backend `.env` file
3. The database tables will be created automatically on first run

## Features

- Restaurant Management: Menu items, orders, payments
- Room Management: Booking, check-in/out, room services
- Inventory Management: Stock tracking, purchase orders
- User Management: Staff accounts and permissions
- Reports: Sales analytics and business insights
- Payment Integration: Cash and M-Pesa payments

## Tech Stack

- Backend: Node.js, Express, TypeScript, TypeORM, PostgreSQL
- Frontend: React, TypeScript, Material-UI, Chart.js
- Authentication: JWT tokens
- Payment: M-Pesa integration

## Troubleshooting

1. **Port already in use**:
   ```bash
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

## License

This project is for Belmont Hotel internal use. 