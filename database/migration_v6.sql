-- Fix empty SKU strings that block creating new products (UNIQUE constraint)
UPDATE products SET sku = NULL WHERE sku = '';
