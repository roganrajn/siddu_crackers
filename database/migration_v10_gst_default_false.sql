-- Retired. Do not run this on every deploy.
-- The original script set gst_applicable = false on ALL orders and wiped GST amounts.
-- Per-order GST is now set at create time from delivery state, and by admin toggle.
SELECT 1;
