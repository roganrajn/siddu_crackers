# GST Implementation Test Plan

## Test Cases

### Test 1: Verify Database Schema
**Steps:**
1. Check that orders table has GST columns:
   - gst_percentage DECIMAL(5, 2)
   - gst_amount DECIMAL(10, 2)
   - gst_applicable BOOLEAN
   - gst_number VARCHAR(50)
   - taxable_amount DECIMAL(10, 2)

2. Check that website_settings table has GST columns:
   - gst_enabled BOOLEAN DEFAULT true
   - gst_percentage DECIMAL(5, 2) DEFAULT 18
   - gst_number VARCHAR(50) DEFAULT '33ABAFD1628C1Z6'

**Expected Result:** All columns present and correctly configured.

---

### Test 2: Admin Settings - GST Configuration
**Steps:**
1. Login to admin panel
2. Navigate to Settings page
3. Scroll to "GST Configuration" section
4. Verify the following fields are present:
   - Enable GST (checkbox)
   - GST Rate (%) (number input, 0-100, step 0.01)
   - GST Number/GSTIN (text input)
5. Disable GST and verify the GST Rate and GST Number fields become disabled
6. Change GST Rate from 18% to 12% and save
7. Reload page and verify the rate is persisted as 12%

**Expected Result:**
- GST settings are editable and persist correctly
- Disabled fields when GST is disabled
- Default values: enabled=true, rate=18%, number='33ABAFD1628C1Z6'

---

### Test 3: Checkout with Tamil Nadu (No GST)
**Steps:**
1. Add products to cart (e.g., 2 items, total after discount: ₹1000)
2. Go to checkout
3. Fill in customer details
4. Select state: **Tamil Nadu**
5. Verify order summary shows:
   - Sub Total: ₹1200 (MRP)
   - Discount: -₹200
   - After Discount: ₹1000
   - Packing (5%): ₹50
   - GST: **Not Applicable** (in gray text)
   - Net Amount: ₹1050
6. Submit order
7. Verify order confirmation page shows the same breakdown
8. Go to admin and view the order detail - GST should show "Not Applicable"

**Expected Result:**
- GST is not calculated for Tamil Nadu
- Order summary correctly shows "GST: Not Applicable"
- Order is saved with gst_applicable=false, gst_amount=0

---

### Test 4: Checkout with Puducherry (No GST)
**Steps:**
1. Add different products to cart (e.g., total after discount: ₹500)
2. Go to checkout
3. Select state: **Puducherry** (or **Pondicherry**)
4. Verify order summary shows:
   - GST: **Not Applicable**
   - Net Amount: ₹525 (with 5% packing, no GST)
5. Submit order
6. Verify order is saved with gst_applicable=false

**Expected Result:**
- Same behavior as Tamil Nadu - no GST applied

---

### Test 5: Checkout with Other State (With GST - 18%)
**Steps:**
1. Add products to cart with discount (e.g., after discount: ₹1000)
2. Go to checkout
3. Select state: **Karnataka** (or any state other than TN/Puducherry)
4. Verify order summary shows:
   - Sub Total: ₹1200 (example)
   - Discount: -₹200
   - After Discount: ₹1000
   - Packing (5%): ₹50
   - GST (18%): **+₹189** (18% of 1050 = 189)
   - Net Amount: **₹1239**
5. Submit order
6. Verify order confirmation shows GST calculation
7. Go to admin and verify order detail shows GST details

**Expected Result:**
- GST is calculated correctly: (after_discount + packing) × gst_rate
- Order is saved with:
  - gst_applicable=true
  - gst_percentage=18
  - gst_amount=189
  - taxable_amount=1050
  - net_amount=1239

---

### Test 6: Dynamic GST Calculation at Checkout
**Steps:**
1. Add products to cart
2. Go to checkout
3. Fill in customer details up to state selection
4. Select state: **Tamil Nadu**
5. Observe order summary (should show GST: Not Applicable)
6. Change state to: **Maharashtra**
7. Observe order summary updates immediately to show GST: +₹xxx
8. Change state back to: **Tamil Nadu**
9. Observe summary updates back to show GST: Not Applicable

**Expected Result:**
- Order summary updates dynamically as state is changed
- GST appears/disappears based on state selection
- Total amount changes based on GST applicability

---

### Test 7: GST Rate Change in Admin
**Steps:**
1. Go to admin Settings
2. In GST Configuration, change GST Rate from 18% to 12%
3. Save settings
4. Create a new order from a state that applies GST (e.g., Karnataka)
5. Verify the order is created with 12% GST (not 18%)
6. Create another order from same state
7. Verify it also uses 12% GST
8. Go back to settings and change GST back to 18%
9. Create another order from the same state
10. Verify it now uses 18% GST

**Expected Result:**
- Old orders keep their original GST rate (stored in order record)
- New orders use the updated GST rate from settings
- GST rate changes only affect new orders, not existing ones

---

### Test 8: Email Confirmation - GST Display
**Steps:**
1. Create an order from a non-GST state (Tamil Nadu)
2. Check the customer email received
3. Verify order breakdown shows:
   - Sub Total
   - Discount
   - After Discount
   - Packing
   - GST: Not Applicable (in gray)
   - Net Amount
4. Create another order from a GST state (e.g., Delhi)
5. Check the customer email
6. Verify order breakdown shows:
   - Sub Total
   - Discount
   - After Discount
   - Packing
   - GST (18%): +₹xxx (in black)
   - Net Amount

**Expected Result:**
- Email templates correctly display GST information
- "Not Applicable" text appears for non-GST states
- GST amount displays correctly for GST states

---

### Test 9: Complex Calculation Verification
**Steps:**
1. Create an order with:
   - Multiple items with different discounts
   - State: Karnataka (applies 18% GST)
   - Example: Item1 MRP₹1000 offer₹700, Qty 2 = ₹1400
   - Example: Item2 MRP₹500 offer₹400, Qty 1 = ₹400
   - Subtotal MRP: ₹2500
   - Subtotal Offer: ₹1800
   - Discount: ₹700
   - After Discount: ₹1800
   - Packing (5%): ₹90
   - After Packing: ₹1890
   - GST (18%): ₹340.2 → rounds to ₹340
   - Net Amount: ₹2230

2. Submit the order
3. Verify in admin that all values are correctly stored:
   - subtotal_mrp: 2500
   - discount_amount: 700
   - after_discount: 1800
   - packing_amount: 90
   - gst_applicable: true
   - gst_percentage: 18
   - gst_amount: 340 (rounded)
   - taxable_amount: 1890
   - net_amount: 2230

**Expected Result:**
- Complex calculations are correct
- Rounding is applied consistently (Math.round to nearest paise)
- All values are persisted correctly

---

### Test 10: Order Tracking - GST Display
**Steps:**
1. Create an order from a GST state
2. Get the order number and phone
3. Go to public order tracking page
4. Enter order number and phone
5. Verify order details display GST correctly in the pricing breakdown

**Expected Result:**
- Order tracking shows saved GST information
- Pricing breakdown matches what was saved at order creation

---

### Test 11: Admin Order List - No Regression
**Steps:**
1. Go to admin Orders page
2. Verify all orders list loads without errors
3. Verify order cards show correct totals
4. Click on various orders (both pre-GST and post-GST orders)
5. Verify order details load correctly

**Expected Result:**
- No regression in existing functionality
- Old orders (without GST columns) still display correctly
- New orders with GST display correctly

---

### Test 12: Minimum Order Check with GST
**Steps:**
1. Set minimum order amount to ₹2000 in settings
2. Add items to cart totaling ₹1200 after discount
3. Go to checkout
4. Select a non-GST state (Tamil Nadu):
   - After Packing: ₹1260 (no GST)
   - Below minimum - should show warning
5. Change to a GST state (e.g., Delhi):
   - After Packing + GST: ₹1488.6
   - Still below minimum - should show warning
6. Add more items to cart
7. In checkout, select a GST state where order now exceeds minimum
8. Verify the "Submit Order" button is now enabled

**Expected Result:**
- Minimum order check uses the net_amount (including GST)
- Warning message shows how much more to add
- Order can only be submitted when net_amount >= min_order_amount

---

## Backward Compatibility Tests

### Test 13: Old Orders Without GST Data
**Steps:**
1. Verify that orders created before GST implementation still display correctly
2. Navigate to an old order in admin
3. Verify order details show correctly (may show null/0 for GST fields)
4. The getStoredOrderBreakdown should handle missing GST fields gracefully

**Expected Result:**
- Old orders don't crash the system
- Pricing display handles missing GST fields with defaults
- gst_applicable defaults to false for old orders

---

## Summary Checklist

- [ ] Database schema updated with GST columns
- [ ] Admin can enable/disable GST
- [ ] Admin can change GST percentage
- [ ] Admin can edit GST number
- [ ] Tamil Nadu shows "GST: Not Applicable"
- [ ] Puducherry shows "GST: Not Applicable"
- [ ] Other states show calculated GST
- [ ] GST calculated on (after_discount + packing)
- [ ] Dynamic pricing in checkout
- [ ] Email shows GST correctly
- [ ] Old orders still work
- [ ] Order tracking shows GST
- [ ] Admin order list works
- [ ] Minimum order check works with GST
- [ ] Rounding is correct
- [ ] All GST data persisted in order
