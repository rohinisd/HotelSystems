from __future__ import annotations

from datetime import date, time
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
    restaurant_id: int | None = None


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


# --- Restaurant ---

class RestaurantResponse(BaseModel):
    id: int
    name: str
    slug: str
    address: str | None
    city: str | None
    phone: str | None
    email: str | None
    logo_url: str | None
    primary_color: str | None
    secondary_color: str | None
    cover_image_url: str | None
    tagline: str | None
    is_active: bool


class RestaurantCustomizeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    tagline: str | None = Field(None, max_length=255)
    logo_url: str | None = Field(None, max_length=500)
    primary_color: str | None = Field(None, max_length=20)
    secondary_color: str | None = Field(None, max_length=20)
    cover_image_url: str | None = Field(None, max_length=500)
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None


# --- Table ---

class RestaurantTableResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    capacity: int
    min_party: int
    max_party: int
    is_active: bool


# --- Reservation ---

class ReservationCreate(BaseModel):
    table_id: int
    reservation_date: date
    reservation_time: time
    party_size: int = Field(..., ge=1, le=20)
    guest_name: str = Field(..., min_length=2, max_length=255)
    guest_email: EmailStr
    guest_phone: str | None = Field(None, max_length=20)
    notes: str | None = None


class ReservationResponse(BaseModel):
    id: int
    restaurant_id: int
    table_id: int
    reservation_date: date
    reservation_time: time
    party_size: int
    status: str
    guest_name: str
    guest_email: str
    guest_phone: str | None
    notes: str | None
    created_at: str | None = None
