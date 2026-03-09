-- Hotel Management System - Seed Data
-- Run after init.sql

-- Default hotel (id 1). Re-running adds another hotel; for clean state drop tables and re-run init.sql + seed.sql.
INSERT INTO hotel (name, address, city, phone) VALUES
('Sample Hotel', '123 Main Street', 'Mumbai', '+91-9876543210');

-- Rooms for hotel id 1
INSERT INTO room (hotel_id, name, room_type, rate_per_night, capacity) VALUES
(1, '101', 'standard', 2500.00, 2),
(1, '102', 'standard', 2500.00, 2),
(1, '201', 'deluxe', 4500.00, 3),
(1, '202', 'deluxe', 4500.00, 3),
(1, '301', 'suite', 7500.00, 4);

-- First user: use the Register page in the frontend to create an account.
-- Optionally add an admin via SQL (generate hash with Python: passlib.CryptContext(schemes=["bcrypt"]).hash("your_password")).
