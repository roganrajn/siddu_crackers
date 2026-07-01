-- Seed data for Siddu Crackers v2

INSERT INTO admin_users (email, password_hash) VALUES
  ('roganinnovater@gmail.com', '$2b$10$4vyCRMoMNCssiqinRZjWLuSjKkId5AtOxG5t7AzlIiWQqYlwE3Gsu'),
  ('sidducrackers@gmail.com', '$2b$10$22loqWSCVnRfAx4nwbEfROHX6j7ouBk3g8qWHp5fsIFIB5J1jswr2')
ON CONFLICT (email) DO NOTHING;

INSERT INTO website_settings (
  company_name, phone, email, whatsapp, address, footer_text, copyright_text, offer_banner,
  confirmation_time, primary_color, secondary_color, accent_color, meta_title, meta_description,
  facebook, instagram, youtube
)
SELECT
  'Siddu Crackers', '+91 89033 27837', 'sidducrackers@gmail.com', '+91 89033 27837',
  'Sivakasi, Tamil Nadu, India',
  'Premium firecrackers direct from Sivakasi. Book your Diwali order today!',
  '© 2026 Siddu Crackers. All rights reserved.',
  '🔥 80% Discount on All Crackers! Book Your Order Now!',
  'Within 2 hours',
  '#7D3C5E', '#F04E8B', '#00A9B0',
  'Siddu Crackers - Premium Firecrackers from Sivakasi',
  'Order premium firecrackers at up to 80% discount. Direct from Sivakasi. Free consultation via phone & WhatsApp.',
  'https://facebook.com/sidducrackers', 'https://instagram.com/sidducrackers', 'https://youtube.com/sidducrackers'
WHERE NOT EXISTS (SELECT 1 FROM website_settings LIMIT 1);

-- Hero Banners (with festive GIF backgrounds)
INSERT INTO banners (title, subtitle, button_text, button_link, image_url, sort_order, is_active) VALUES
  ('80% OFF All Crackers', 'Direct from Sivakasi · Premium Quality · Best Prices', 'Book Your Order Now', '#products', '/banners/fireworks-1.gif', 1, true),
  ('Festival Mega Sale', 'Limited time discounts on all categories', 'Shop Now', '#products', '/banners/fireworks-2.gif', 2, true),
  ('Kids Special Range', 'Safe and fun crackers for children', 'Explore Kids Range', '#category-kids-special', '/banners/sparklers.gif', 3, true),
  ('Premium Gift Boxes', 'Curated gift boxes for every budget', 'View Gift Boxes', '#category-gift-boxes', '/banners/celebration.gif', 4, true);

-- Categories with icons and colors
INSERT INTO categories (name, slug, icon, color, sort_order, is_visible) VALUES
  ('Lakshmi Crackers', 'lakshmi-crackers', '🪔', '#7D3C5E', 1, true),
  ('Bijili', 'bijili', '⚡', '#ffcf33', 2, true),
  ('Flower Pots', 'flower-pots', '🌸', '#e91e8c', 3, true),
  ('Rockets', 'rockets', '🚀', '#0066ff', 4, true),
  ('Bombs', 'bombs', '💣', '#dc2626', 5, true),
  ('Ground Chakkars', 'ground-chakkars', '🌀', '#7c3aed', 6, true),
  ('Kids Special', 'kids-special', '👶', '#22c55e', 7, true),
  ('Gift Boxes', 'gift-boxes', '🎁', '#f59e0b', 8, true),
  ('Fancy Crackers', 'fancy-crackers', '✨', '#ec4899', 9, true),
  ('Sparklers', 'sparklers', '🎇', '#06b6d4', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Products with tags
INSERT INTO products (name, slug, description, original_price, offer_price, discount_percentage, sku, tags, is_featured, is_best_seller, is_visible, sort_order) VALUES
  ('4 Inch Lakshmi', '4-inch-lakshmi', 'Premium 4 inch Lakshmi cracker with bright colors and loud sound', 500.00, 100.00, 80, 'LK-001', ARRAY['best_seller','festival_offer'], true, true, true, 1),
  ('2 Sound Bijili', '2-sound-bijili', 'Classic 2 sound bijili pack - a customer favorite', 300.00, 60.00, 80, 'BJ-001', ARRAY['best_seller','popular'], false, true, true, 2),
  ('Big Flower Pot', 'big-flower-pot', 'Large flower pot with spectacular multi-color display', 400.00, 80.00, 80, 'FP-001', ARRAY['featured','trending'], true, false, true, 3),
  ('Sky Rocket Deluxe', 'sky-rocket-deluxe', 'High flying sky rocket with golden trail', 600.00, 120.00, 80, 'RK-001', ARRAY['best_seller','trending'], true, true, true, 4),
  ('1000 Wala Garlands', '1000-wala-garlands', '1000 wala garland crackers for grand celebrations', 800.00, 160.00, 80, 'LK-002', ARRAY['popular','festival_offer'], false, true, true, 5),
  ('Atom Bomb', 'atom-bomb', 'Loud atom bomb cracker for maximum impact', 350.00, 70.00, 80, 'BM-001', ARRAY['popular'], false, false, true, 6),
  ('Ground Chakkar Big', 'ground-chakkar-big', 'Big ground spinning chakkar with colorful sparks', 250.00, 50.00, 80, 'GC-001', ARRAY['best_seller'], false, true, true, 7),
  ('Kids Fountain Pack', 'kids-fountain-pack', 'Safe fountain pack specially designed for kids', 200.00, 40.00, 80, 'KS-001', ARRAY['new','limited'], true, false, true, 8),
  ('Premium Gift Box', 'premium-gift-box', 'Curated gift box with assorted premium crackers', 2000.00, 400.00, 80, 'GB-001', ARRAY['best_seller','festival_offer','limited'], true, true, true, 9),
  ('Electric Sparklers', 'electric-sparklers', '12 inch electric sparklers pack - 10 pieces', 150.00, 30.00, 80, 'SP-001', ARRAY['best_seller','new'], false, true, true, 10),
  ('5 Inch Lakshmi', '5-inch-lakshmi', 'Premium 5 inch Lakshmi cracker - extra loud', 750.00, 150.00, 80, 'LK-003', ARRAY['new'], false, false, true, 11),
  ('4 Sound Bijili', '4-sound-bijili', '4 sound bijili mega pack for big celebrations', 500.00, 100.00, 80, 'BJ-002', ARRAY['trending'], false, false, true, 12)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE (p.slug = '4-inch-lakshmi' AND c.slug = 'lakshmi-crackers')
   OR (p.slug = '5-inch-lakshmi' AND c.slug = 'lakshmi-crackers')
   OR (p.slug = '1000-wala-garlands' AND c.slug = 'lakshmi-crackers')
   OR (p.slug = '2-sound-bijili' AND c.slug = 'bijili')
   OR (p.slug = '4-sound-bijili' AND c.slug = 'bijili')
   OR (p.slug = 'big-flower-pot' AND c.slug = 'flower-pots')
   OR (p.slug = 'sky-rocket-deluxe' AND c.slug = 'rockets')
   OR (p.slug = 'atom-bomb' AND c.slug = 'bombs')
   OR (p.slug = 'ground-chakkar-big' AND c.slug = 'ground-chakkars')
   OR (p.slug = 'kids-fountain-pack' AND c.slug = 'kids-special')
   OR (p.slug = 'premium-gift-box' AND c.slug = 'gift-boxes')
   OR (p.slug = 'electric-sparklers' AND c.slug = 'sparklers')
ON CONFLICT DO NOTHING;

-- Sample Reviews
INSERT INTO reviews (customer_name, rating, comment, is_visible, sort_order) VALUES
  ('Ramesh Kumar', 5, 'Excellent quality crackers! Best prices and fast delivery. Highly recommended!', true, 1),
  ('Priya S', 5, 'Ordered gift box for Diwali. Amazing collection and great customer service via WhatsApp.', true, 2),
  ('Arun M', 4, 'Direct from Sivakasi quality at unbelievable prices. Will order again next year!', true, 3),
  ('Deepa R', 5, 'Kids special pack was perfect for our family celebration. Safe and beautiful!', true, 4);
