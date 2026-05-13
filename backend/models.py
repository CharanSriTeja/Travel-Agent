from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# ─── Pydantic Models for MongoDB ─────────────────────────────────

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class BookingBase(BaseModel):
    user_id: str
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
    status: str = "confirmed"

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: str = Field(alias="_id")
    booked_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
