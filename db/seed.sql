-- SFMS Seed Data
-- Realistic Indian sports facility data

-- Facility (tenant)
INSERT INTO facility (name, slug, owner_name, owner_email, owner_phone) VALUES
('TurfStack Arena', 'turfstack-arena', 'Girish Hiremath', 'girish@turfstack.in', '9876543210');

-- Branches
INSERT INTO branch (facility_id, name, address, city, state, pincode, phone) VALUES
(1, 'Gachibowli', 'Plot 42, Nanakramguda Road, Financial District', 'Hyderabad', 'Telangana', '500032', '04012345678'),
(1, 'Madhapur', 'Cyber Towers Lane, Near Inorbit Mall', 'Hyderabad', 'Telangana', '500081', '04012345679');

-- Courts
INSERT INTO court (branch_id, facility_id, name, sport, surface_type, hourly_rate, peak_hour_rate, slot_duration_minutes, is_indoor) VALUES
(1, 1, 'Court A', 'pickleball', 'synthetic', 800.00, 1200.00, 60, TRUE),
(1, 1, 'Court B', 'pickleball', 'synthetic', 800.00, 1200.00, 60, TRUE),
(1, 1, 'Court C', 'cricket', 'synthetic', 1500.00, 2000.00, 60, FALSE),
(1, 1, 'Court D', 'badminton', 'wooden', 600.00, 900.00, 60, TRUE),
(2, 1, 'Court 1', 'pickleball', 'synthetic', 700.00, 1000.00, 60, TRUE),
(2, 1, 'Court 2', 'volleyball', 'sand', 600.00, 900.00, 60, FALSE),
(2, 1, 'Court 3', 'cricket', 'turf', 1800.00, 2500.00, 90, FALSE);

-- Users (password for all: "password123" -- bcrypt hash)
-- Generated with: python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('password123'))"
INSERT INTO users (facility_id, email, hashed_password, full_name, phone, role) VALUES
(1, 'owner@turfstack.in', '$2b$12$LJ3m4ys3Lk0TSwHBQRCBxuGz7AbDwNnqX6bIylfhk3qXRMqE5tC.a', 'Girish Hiremath', '9876543210', 'owner'),
(1, 'manager@turfstack.in', '$2b$12$LJ3m4ys3Lk0TSwHBQRCBxuGz7AbDwNnqX6bIylfhk3qXRMqE5tC.a', 'Ravi Kumar', '9876543211', 'manager'),
(1, 'staff@turfstack.in', '$2b$12$LJ3m4ys3Lk0TSwHBQRCBxuGz7AbDwNnqX6bIylfhk3qXRMqE5tC.a', 'Priya Sharma', '9876543212', 'staff'),
(1, 'accounts@turfstack.in', '$2b$12$LJ3m4ys3Lk0TSwHBQRCBxuGz7AbDwNnqX6bIylfhk3qXRMqE5tC.a', 'Suresh Reddy', '9876543214', 'accountant'),
(NULL, 'arjun@turfstack.in', '$2b$12$LJ3m4ys3Lk0TSwHBQRCBxuGz7AbDwNnqX6bIylfhk3qXRMqE5tC.a', 'Arjun Reddy', '9876543213', 'player'),
(NULL, 'meera@turfstack.in', '$2b$12$LJ3m4ys3Lk0TSwHBQRCBxuGz7AbDwNnqX6bIylfhk3qXRMqE5tC.a', 'Meera Patel', '9876543215', 'player');

-- Pricing rules
INSERT INTO pricing_rule (court_id, facility_id, day_of_week, start_time, end_time, rate, label) VALUES
-- Court A (pickleball) - weekday pricing
(1, 1, NULL, '06:00', '09:00', 600.00, 'early-bird'),
(1, 1, NULL, '09:00', '17:00', 800.00, 'regular'),
(1, 1, NULL, '17:00', '21:00', 1200.00, 'peak'),
(1, 1, NULL, '21:00', '23:00', 800.00, 'late'),
-- Court A - weekend override
(1, 1, 5, '06:00', '23:00', 1000.00, 'saturday'),
(1, 1, 6, '06:00', '23:00', 1000.00, 'sunday'),
-- Court C (cricket) pricing
(3, 1, NULL, '06:00', '10:00', 1200.00, 'morning'),
(3, 1, NULL, '10:00', '16:00', 1500.00, 'regular'),
(3, 1, NULL, '16:00', '21:00', 2000.00, 'peak'),
-- Court 1 (Madhapur pickleball)
(5, 1, NULL, '06:00', '09:00', 500.00, 'early-bird'),
(5, 1, NULL, '09:00', '17:00', 700.00, 'regular'),
(5, 1, NULL, '17:00', '21:00', 1000.00, 'peak'),
(5, 1, NULL, '21:00', '23:00', 700.00, 'late');

-- Sample bookings (today and tomorrow)
INSERT INTO booking (facility_id, court_id, player_id, date, start_time, end_time, status, booking_type, amount, created_by) VALUES
(1, 1, 5, CURRENT_DATE, '09:00', '10:00', 'confirmed', 'online', 800.00, 5),
(1, 1, 6, CURRENT_DATE, '10:00', '11:00', 'confirmed', 'online', 800.00, 6),
(1, 2, 5, CURRENT_DATE, '17:00', '18:00', 'confirmed', 'online', 1200.00, 5),
(1, 3, NULL, CURRENT_DATE, '16:00', '17:00', 'confirmed', 'walkin', 2000.00, 3),
(1, 1, 5, CURRENT_DATE + 1, '18:00', '19:00', 'confirmed', 'online', 1200.00, 5);

-- Sample payments
INSERT INTO payment (facility_id, booking_id, amount, currency, status, method, paid_at) VALUES
(1, 1, 800.00, 'INR', 'captured', 'razorpay', NOW()),
(1, 2, 800.00, 'INR', 'captured', 'razorpay', NOW()),
(1, 3, 1200.00, 'INR', 'captured', 'upi', NOW()),
(1, 4, 2000.00, 'INR', 'captured', 'cash', NOW());
