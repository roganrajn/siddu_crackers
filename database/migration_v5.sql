-- Replace old contact email in site settings
UPDATE settings
SET email = 'sidducrackers@gmail.com'
WHERE email = 'info@sidducrackers.com';
