from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel
from database import get_db
from auth import (
    create_user, authenticate_user, get_user_by_id, 
    verify_token, create_access_token
)
from models import UserCreate, User, BookingCreate, Booking
from datetime import datetime
from bson import ObjectId

router = APIRouter()

# ─── Request/Response Models ──────────────────────────────────────

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user: dict
    token: str

class BookingRequest(BaseModel):
    airline: str
    flight_no: str
    from_airport: str
    to_airport: str
    departure_time: str
    arrival_time: str
    duration: str
    stops: str
    cabin: str = "Economy"
    price: str

# ─── Helper to get current user from token ────────────────────────

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ─── Authentication Routes ────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    try:
        user_create = UserCreate(
            email=request.email,
            password=request.password,
            full_name=request.full_name
        )
        user = await create_user(user_create)
        token = create_access_token(str(user.id))
        
        return AuthResponse(
            user=user.model_dump(by_alias=True),
            token=token
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    result = await authenticate_user(request.email, request.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user, token = result
    return AuthResponse(
        user=user.model_dump(by_alias=True),
        token=token
    )

@router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.model_dump(by_alias=True)

# ─── Booking Routes ───────────────────────────────────────────────

@router.post("/bookings")
async def create_booking(
    booking: BookingRequest,
    current_user: User = Depends(get_current_user)
):
    db = get_db()
    
    booking_data = {
        "user_id": str(current_user.id),
        "airline": booking.airline,
        "flight_no": booking.flight_no,
        "from_airport": booking.from_airport,
        "to_airport": booking.to_airport,
        "departure_time": booking.departure_time,
        "arrival_time": booking.arrival_time,
        "duration": booking.duration,
        "stops": booking.stops,
        "cabin": booking.cabin,
        "price": booking.price,
        "status": "confirmed",
        "booked_at": datetime.utcnow(),
    }
    
    result = await db.bookings.insert_one(booking_data)
    booking_data["_id"] = str(result.inserted_id)
    
    return {"success": True, "booking": booking_data}

@router.get("/bookings")
async def get_bookings(current_user: User = Depends(get_current_user)):
    db = get_db()
    
    bookings = await db.bookings.find(
        {"user_id": str(current_user.id)}
    ).sort("booked_at", -1).to_list(None)
    
    for booking in bookings:
        booking["_id"] = str(booking["_id"])
    
    return bookings

@router.get("/bookings/{booking_id}")
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    db = get_db()
    
    try:
        booking = await db.bookings.find_one({
            "_id": ObjectId(booking_id),
            "user_id": str(current_user.id)
        })
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking["_id"] = str(booking["_id"])
        return booking
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
