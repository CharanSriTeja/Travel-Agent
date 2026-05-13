# Travel Agent Backend - MongoDB Setup

## Prerequisites

- Python 3.8+
- MongoDB Cloud account (or local MongoDB)
- Virtual environment setup

## Installation

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**

Create a `.env` file in the backend directory:
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/travel_agent
JWT_SECRET=your-secret-key-change-this
```

Replace:
- `username` and `password` with your MongoDB credentials
- `cluster` with your MongoDB cluster name
- `JWT_SECRET` with a secure random string

## MongoDB Setup

### Using MongoDB Atlas (Cloud):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add a database user with read/write permissions
4. Get your connection string
5. Replace placeholders in `.env`

### Using Local MongoDB:

```bash
# macOS (Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install -y mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

Local connection string:
```
MONGODB_URL=mongodb://localhost:27017
```

## Run the Server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Database Collections

The app automatically creates these collections:
- `users` - User accounts with hashed passwords
- `bookings` - Flight bookings linked to users

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `GET /auth/me` - Get current user (requires token)

### Bookings
- `POST /bookings` - Create booking (requires auth)
- `GET /bookings` - Get all user bookings (requires auth)
- `GET /bookings/{booking_id}` - Get specific booking (requires auth)

## Frontend Setup

Add to `Frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

## Notes

- All passwords are hashed with bcrypt
- Authentication uses JWT tokens
- Tokens are stored in browser localStorage
- All API requests require Bearer token in Authorization header
