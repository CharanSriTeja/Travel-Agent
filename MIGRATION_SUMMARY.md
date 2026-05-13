# Migration from Supabase to MongoDB - Summary

## What Changed

### Backend (Python/FastAPI)

**New Files Created:**
- `models.py` - Pydantic models for User and Booking with MongoDB schemas
- `database.py` - MongoDB connection and client management using Motor (async driver)
- `auth.py` - Authentication utilities including password hashing (bcrypt), JWT token generation/verification, and user management
- `api/authroute.py` - New authentication and booking API routes replacing Supabase auth
- `MONGODB_SETUP.md` - Complete setup guide for MongoDB

**Modified Files:**
- `main.py` - Added MongoDB connection lifecycle management via FastAPI lifespan
- `requirements.txt` - Added pymongo, motor, and pydantic dependencies

**Key Changes:**
- Replaced Supabase Auth with custom JWT-based authentication
- Passwords are securely hashed with bcrypt
- All data persists to MongoDB instead of Supabase PostgreSQL
- Async database operations using Motor for better performance

### Frontend (React)

**Removed Files:**
- `src/lib/supabase.js` - No longer needed

**New Files Created:**
- `src/lib/api.js` - Unified API client for all backend operations with auth token management

**Modified Files:**
- `package.json` - Removed `@supabase/supabase-js` dependency
- `src/context/AuthContext.jsx` - Now uses MongoDB auth API instead of Supabase
- `src/components/AuthModal.jsx` - Updated to use new auth API
- `src/components/BookingsModal.jsx` - Updated to use new booking API
- `src/api/bookingApi.js` - Simplified to use new API client
- `src/App.jsx` - Updated imports and auth handling

**Key Changes:**
- Authentication tokens now stored in localStorage
- User data structure updated to match MongoDB schema
- All API calls go through centralized axios client with automatic token injection
- Sign-out now uses localStorage cleanup

### Configuration

**Environment Variables Needed:**

Backend (`.env`):
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/travel_agent
JWT_SECRET=your-secret-key
```

Frontend (`.env`):
```
VITE_API_URL=http://localhost:8000
```

## Database Structure

### MongoDB Collections

**users**
```
{
  _id: ObjectId,
  email: string (unique),
  full_name: string,
  password_hash: string (bcrypt),
  created_at: datetime,
  updated_at: datetime
}
```

**bookings**
```
{
  _id: ObjectId,
  user_id: string (reference to user._id),
  airline: string,
  flight_no: string,
  from_airport: string,
  to_airport: string,
  departure_time: string,
  arrival_time: string,
  duration: string,
  stops: string,
  cabin: string,
  price: string,
  status: string,
  booked_at: datetime
}
```

## Setup Instructions

1. **Add MongoDB Connection:**
   - Get connection string from MongoDB Atlas
   - Update `.env` with `MONGODB_URL`

2. **Set JWT Secret:**
   - Generate a secure random string
   - Add to `.env` as `JWT_SECRET`

3. **Install Dependencies:**
   Backend: `pip install -r requirements.txt`
   Frontend: Already handled by Vite

4. **Run Backend:**
   ```bash
   uvicorn main:app --reload
   ```

5. **Run Frontend:**
   ```bash
   cd Frontend && npm run dev
   ```

## Testing

- Sign up creates a new user in MongoDB
- Sign in validates credentials against hashed password
- JWT token is issued on successful auth
- Bookings are stored with user_id reference
- All API endpoints require valid JWT token

## Migration Complete ✓

All Supabase dependencies have been removed and replaced with:
- **Authentication:** Custom JWT-based system with bcrypt password hashing
- **Database:** MongoDB with Motor async driver
- **API Client:** Centralized axios instance with token management
