# Quick Start Guide - MongoDB Migration

## What You Need to Do

### 1. Set Up MongoDB
- Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Create a database user
- Get your connection string (looks like: `mongodb+srv://username:password@cluster-name.mongodb.net/travel_agent`)

### 2. Update Environment Variables

**Backend (.env in root directory or backend/):**
```
MONGODB_URL=your-connection-string-here
JWT_SECRET=any-secure-random-string-here
```

**Frontend (.env in Frontend/):**
```
VITE_API_URL=http://localhost:8000
```

### 3. Install Dependencies

Backend:
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run the Application

Terminal 1 - Backend:
```bash
cd backend
uvicorn main:app --reload
```

Terminal 2 - Frontend:
```bash
cd Frontend
npm run dev
```

## What's New

✓ **Authentication:** Custom JWT-based system (no more Supabase Auth)
✓ **Database:** MongoDB with async driver (Motor)
✓ **Password Security:** bcrypt hashing for all passwords
✓ **API Routes:** 
  - `/auth/signup` - Register new users
  - `/auth/signin` - Login users
  - `/auth/me` - Get current user
  - `/bookings` - Manage flight bookings

## Key Files

**Backend:**
- `models.py` - Data models
- `database.py` - MongoDB connection
- `auth.py` - Authentication logic
- `api/authroute.py` - Auth API endpoints

**Frontend:**
- `src/lib/api.js` - API client with token management
- `src/context/AuthContext.jsx` - Auth state management

## Troubleshooting

**"MONGODB_URL not set"**
- Add `MONGODB_URL` to your `.env` file with valid MongoDB connection string

**"Connection refused" to backend**
- Make sure backend is running: `uvicorn main:app --reload`
- Check VITE_API_URL matches backend URL (default: http://localhost:8000)

**"Invalid token"**
- Clear localStorage and sign in again
- Make sure JWT_SECRET is set in backend

## Next Steps

1. Sign up a new account (creates user in MongoDB)
2. Search for flights using the AI chat
3. Book a flight (stores booking in MongoDB)
4. View bookings in "My Bookings" modal

All data is now stored in MongoDB! 🎉
