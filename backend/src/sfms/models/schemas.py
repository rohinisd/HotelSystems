from __future__ import annotations

from datetime import date, time, datetime
from enum import Enum

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
    facility_id: int | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    role: str
    facility_id: int | None
    is_active: bool


# --- Facility ---

class FacilityCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    owner_name: str | None = None
    owner_email: str | None = None
    owner_phone: str | None = None


class FacilityResponse(BaseModel):
    id: int
    name: str
    slug: str
    owner_name: str | None
    owner_email: str | None
    owner_phone: str | None
    subscription_plan: str
    is_active: bool
    created_at: datetime


# --- Branch ---

class BranchCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = Field(None, max_length=10)
    phone: str | None = None
    opening_time: time = time(6, 0)
    closing_time: time = time(23, 0)


class BranchResponse(BaseModel):
    id: int
    facility_id: int
    name: str
    address: str | None
    city: str | None
    state: str | None
    pincode: str | None
    phone: str | None
    opening_time: time
    closing_time: time
    is_active: bool


# --- Court ---

class CourtCreate(BaseModel):
    branch_id: int
    name: str = Field(..., min_length=1, max_length=100)
    sport: str = Field(..., min_length=2, max_length=50)
    surface_type: str | None = None
    hourly_rate: float = Field(..., gt=0)
    peak_hour_rate: float | None = Field(None, gt=0)
    slot_duration_minutes: int = Field(60, ge=15, le=180)
    is_indoor: bool = False


class CourtResponse(BaseModel):
    id: int
    branch_id: int
    facility_id: int
    name: str
    sport: str
    surface_type: str | None
    hourly_rate: float
    peak_hour_rate: float | None
    slot_duration_minutes: int
    is_indoor: bool
    is_active: bool


class CourtUpdate(BaseModel):
    name: str | None = None
    sport: str | None = None
    surface_type: str | None = None
    hourly_rate: float | None = Field(None, gt=0)
    peak_hour_rate: float | None = Field(None, gt=0)
    slot_duration_minutes: int | None = Field(None, ge=15, le=180)
    is_indoor: bool | None = None
    is_active: bool | None = None


# --- Booking ---

class BookingType(str, Enum):
    ONLINE = "online"
    WALKIN = "walkin"
    BLOCKED = "blocked"


class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class BookingCreateRequest(BaseModel):
    court_id: int
    date: date
    start_time: time
    end_time: time
    booking_type: BookingType = BookingType.ONLINE
    player_name: str | None = None
    player_phone: str | None = None
    notes: str | None = Field(None, max_length=500)


class BookingResponse(BaseModel):
    id: int
    facility_id: int
    court_id: int
    court_name: str | None = None
    branch_name: str | None = None
    date: date
    start_time: time
    end_time: time
    status: str
    booking_type: str
    player_name: str | None
    player_phone: str | None
    amount: float
    notes: str | None
    created_at: datetime


# --- Slots ---

class SlotResponse(BaseModel):
    start_time: str
    end_time: str
    is_available: bool
    court_id: int
    price: float


# --- Dashboard ---

class DashboardKPI(BaseModel):
    label: str
    value: str
    change_pct: float
    period: str


# --- Pricing ---

class PricingRuleResponse(BaseModel):
    id: int
    court_id: int
    day_of_week: int | None
    start_time: time
    end_time: time
    rate: float
    label: str | None
    is_active: bool
