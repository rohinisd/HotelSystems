-- Restaurant Table Booking SaaS - Database Schema
-- Multi-tenant: each restaurant is a tenant

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tenant: one row per restaurant
CREATE TABLE IF NOT EXISTS restaurant (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    -- Customization (SaaS: customer can customize their page)
    logo_url VARCHAR(500),
    primary_color VARCHAR(20) DEFAULT '#0f766e',
    secondary_color VARCHAR(20) DEFAULT '#134e4a',
    cover_image_url VARCHAR(500),
    tagline VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables in a restaurant (capacity = seats)
CREATE TABLE IF NOT EXISTS restaurant_table (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    min_party INTEGER DEFAULT 1,
    max_party INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff / owners (restaurant_id = which restaurant they belong to)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurant(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'guest',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table reservation
CREATE TABLE IF NOT EXISTS reservation (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    table_id INTEGER NOT NULL REFERENCES restaurant_table(id) ON DELETE CASCADE,
    guest_id INTEGER REFERENCES users(id),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL DEFAULT 2,
    status VARCHAR(20) DEFAULT 'confirmed',
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_table_restaurant ON restaurant_table(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_restaurant ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservation_restaurant ON reservation(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservation_table ON reservation(table_id);
CREATE INDEX IF NOT EXISTS idx_reservation_date ON reservation(restaurant_id, reservation_date, reservation_time);
