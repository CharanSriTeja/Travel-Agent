import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
from database import get_db
from models import User, UserCreate

# ─── Authentication Utilities ──────────────────────────────────────

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str) -> str:
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.InvalidTokenError:
        return None

async def create_user(user_create: UserCreate) -> User:
    """Create new user in MongoDB"""
    db = get_db()
    
    # Check if user already exists
    existing = await db.users.find_one({"email": user_create.email})
    if existing:
        raise ValueError("User with this email already exists")
    
    user_data = {
        "email": user_create.email,
        "full_name": user_create.full_name or "",
        "password_hash": hash_password(user_create.password),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.users.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)
    return User(**user_data)

async def authenticate_user(email: str, password: str) -> Optional[tuple[User, str]]:
    """Authenticate user and return user + token"""
    db = get_db()
    
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        return None
    
    if not verify_password(password, user_doc.get("password_hash", "")):
        return None
    
    user_data = {**user_doc, "_id": str(user_doc["_id"])}
    user = User(**user_data)
    token = create_access_token(str(user_doc["_id"]))
    
    return user, token

async def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID"""
    db = get_db()
    from bson import ObjectId
    
    try:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            user_data = {**user_doc, "_id": str(user_doc["_id"])}
            return User(**user_data)
    except:
        pass
    
    return None
