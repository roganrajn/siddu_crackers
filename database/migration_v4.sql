-- Add Siddu Crackers admin user (password: Siddu@123 — change after first login)
INSERT INTO admin_users (email, password_hash) VALUES
  ('sidducrackers@gmail.com', '$2b$10$22loqWSCVnRfAx4nwbEfROHX6j7ouBk3g8qWHp5fsIFIB5J1jswr2')
ON CONFLICT (email) DO NOTHING;
