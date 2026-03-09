from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str | None = Field(None, max_length=20)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    hotel_id: int | None = None


# --- Hotel ---

class HotelResponse(BaseModel):
    id: int
    name: str
    address: str | None
    city: str | None
    phone: str | None
    is_active: bool


# --- Room ---

class RoomResponse(BaseModel):
    id: int
    hotel_id: int
    name: str
    room_type: str
    rate_per_night: float
    capacity: int
    is_available: bool
