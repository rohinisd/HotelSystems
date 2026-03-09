-- Restaurant Table Booking SaaS - Seed Data

INSERT INTO restaurant (name, slug, address, city, phone, tagline, primary_color, secondary_color) VALUES
('The Garden Bistro', 'garden-bistro', '45 Green Avenue', 'Mumbai', '+91-9876543210', 'Fresh food, warm vibes', '#0f766e', '#134e4a');

INSERT INTO restaurant_table (restaurant_id, name, capacity, min_party, max_party) VALUES
(1, 'Table 1', 2, 1, 2),
(1, 'Table 2', 2, 1, 2),
(1, 'Table 3', 4, 2, 4),
(1, 'Table 4', 4, 2, 4),
(1, 'Table 5', 6, 4, 6);

-- Owner for restaurant 1. To set password: UPDATE users SET hashed_password = '<bcrypt_hash>' WHERE email = 'owner@gardenbistro.com';
-- Generate hash: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('your_password'))"
INSERT INTO users (restaurant_id, email, hashed_password, full_name, role) VALUES
(1, 'owner@gardenbistro.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2qTqR5cKz7K2e', 'Restaurant Owner', 'owner')
ON CONFLICT (email) DO NOTHING;
