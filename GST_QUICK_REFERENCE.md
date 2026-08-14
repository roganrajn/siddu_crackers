# GST Implementation - Quick Reference & Testing Guide

## What Was Implemented

✅ Complete GST functionality across frontend and backend
✅ Dynamic pricing at checkout based on customer state
✅ Admin settings to configure GST (enable/disable, rate, number)
✅ Order data preservation (old orders unaffected)
✅ Email display of GST in order confirmations
✅ Order tracking and admin detail pages show GST

---

## Quick Start Testing

### Step 1: Start the Application
```bash
# Terminal 1: Backend
cd backend
npm install  # if needed
npm start

# Terminal 2: Frontend  
cd frontend
npm install  # if needed
npm run dev
```

### Step 2: Test Admin Settings
1. Login to admin panel
2. Go to Settings page
3. Scroll to **"GST Configuration"** section
4. You should see:
   - ☐ Enable GST (checkbox)
   - GST Rate (%) (number field)
   - GST Number/GSTIN (text field)

**Test Enable/Disable:**
- Check the "Enable GST" checkbox
- Notice the rate and number fields become active
- Uncheck it - fields become disabled
- Save settings

**Test Rate Change:**
- Enter 12 in the rate field
- Save settings
- Reload page
- Verify it shows 12%
- Change back to 18 and save

### Step 3: Test Checkout with Different States

**Scenario 1: Tamil Nadu (No GST)**
1. Add items to cart (any amount)
2. Go to Checkout
3. Select state: **Tamil Nadu**
4. Look at Order Summary on the right
5. Verify it shows: **"GST: Not Applicable"** (in gray)
6. Note the total = After Discount + Packing (NO GST added)

**Scenario 2: Puducherry (No GST)**
1. Clear cart or add new items
2. Go to Checkout
3. Select state: **Puducherry**
4. Verify: **"GST: Not Applicable"**
5. Total = After Discount + Packing

**Scenario 3: Karnataka/Delhi/Other State (With 18% GST)**
1. Add items and go to Checkout
2. Select state: **Karnataka** (or Maharashtra, Delhi, etc.)
3. Look at Order Summary:
   - Sub Total: ₹XXX
   - Discount: -₹XXX
   - After Discount: ₹XXX
   - Packing (5%): ₹XXX
   - **GST (18%): +₹XXX** ← This should appear
   - Net Amount: ₹XXX (higher than scenario 1)
4. Verify GST amount = Packing amount × 0.18

**Example Calculation (Verify Manually):**
- After Discount: ₹1000
- Packing 5%: ₹50
- Taxable: ₹1050
- GST 18%: ₹189 (1050 × 0.18)
- Net: ₹1239 (1050 + 189)

### Step 4: Test Dynamic Pricing Update
1. In checkout, fill all fields except state
2. Select state: **Tamil Nadu**
3. Watch order summary - should show "GST: Not Applicable"
4. Change to **Karnataka**
5. Watch summary update immediately - GST amount appears
6. Change back to **Tamil Nadu**
7. Summary updates back to "Not Applicable"

### Step 5: Create Test Orders

**Create order from GST-free state:**
1. Select Tamil Nadu or Puducherry
2. Submit order
3. Note the order number
4. Go to Admin → Orders
5. Click the order
6. In order detail, look for GST section
7. Should show: **GST: Not Applicable** or similar

**Create order from GST state:**
1. Select Karnataka or any other state
2. Submit order
3. Go to Admin → Orders
4. Click the order
5. Look at pricing breakdown
6. Should show GST line with percentage and amount
7. Verify total includes GST

### Step 6: Check Emails
If email is configured:
1. After creating an order, check customer email
2. Look for email from admin
3. In order breakdown table:
   - For Tamil Nadu orders: "GST" shows "Not Applicable"
   - For other states: "GST (18%)" shows the amount

---

## Default Settings
- **GST Enabled:** Yes (true)
- **GST Rate:** 18%
- **GST Number:** 33ABAFD1628C1Z6
- **Exempt States:** Tamil Nadu, Puducherry, Pondicherry

---

## Key Numbers to Remember

**Calculation Order (Important!):**
1. Calculate subtotals based on item prices
2. Calculate discount
3. After discount = subtotal offer
4. Add packing charges to after discount
5. Calculate GST on (after discount + packing)
6. Add GST to get final total

**Rounding:**
- All amounts rounded to nearest ₹0.01 (paise)
- No special rounding rules - standard Math.round()

---

## Troubleshooting

### GST Not Showing at Checkout
**Solution:** Check that state is not Tamil Nadu or Puducherry
- Try other states like Karnataka, Maharashtra, Delhi
- Verify GST is enabled in settings

### Prices Don't Match After Refresh
**Solution:** Database schema might not have applied yet
- Check server logs for errors
- Make sure backend started after code changes
- May need to manually run schema migration if auto-apply fails

### Settings Not Saving
**Solution:** Boolean field (GST Enabled) might not be sending correctly
- Try unchecking GST Enabled, then check it again
- Try changing rate to verify form works
- Check browser console for errors

### Admin Can't See Orders
**Solution:** Common - first time viewing with GST columns
- Reload page
- Try another order
- Check backend logs for SQL errors

---

## Files to Review If Issues Occur

**Frontend:**
- `frontend/src/pages/CheckoutPage.vue` - Checkout pricing
- `frontend/src/components/order/OrderPricingSummary.vue` - Summary display
- `frontend/src/pages/admin/SettingsPage.vue` - Settings form
- `frontend/src/utils/orderPricing.js` - Calculation logic

**Backend:**
- `backend/src/services/order.service.js` - Order creation
- `backend/src/routes/settings.js` - Settings endpoint
- `backend/src/utils/orderPricing.js` - Calculation logic
- `backend/src/services/email.service.js` - Email generation

---

## Test Checklist (TRY THESE)

- [ ] Navigate to Admin Settings and see GST Configuration section
- [ ] Toggle GST Enabled checkbox
- [ ] Change GST rate and verify it saves
- [ ] Add items to cart
- [ ] Go to checkout and select Tamil Nadu - see "GST: Not Applicable"
- [ ] Go back, select Karnataka - see GST amount calculated
- [ ] Change state multiple times - watch pricing update live
- [ ] Submit order from Tamil Nadu
- [ ] Submit order from another state
- [ ] Go to admin and view both orders
- [ ] Compare GST data in each order
- [ ] Verify order totals match calculation
- [ ] Check emails if configured
- [ ] Old orders still display correctly (if any exist)

---

## Support Info

### What Information to Provide If Reporting Issues
1. State selected during checkout
2. Expected vs actual total amount
3. Screenshot of order summary
4. Admin settings current values
5. Server log errors (if any)
6. Browser console errors (F12 → Console tab)

### Common Test Values
- Min order: ₹5000
- Packing: 5%
- GST rate: 18% (or whatever you set)
- GST number: 33ABAFD1628C1Z6

---

## Success Criteria

When everything is working correctly:

✅ Admin can view and edit GST settings
✅ Checkout shows dynamic pricing based on state
✅ Tamil Nadu/Puducherry show "GST: Not Applicable"
✅ Other states show calculated GST amount
✅ Total changes when state changes
✅ Orders can be created and viewed
✅ Order details show GST correctly
✅ Emails display GST in breakdown
✅ Old orders still work (if any exist)
✅ No JavaScript errors in console
✅ No database/backend errors in logs

---

## Next Steps After Testing

1. **If working:** Deploy to production following deployment notes
2. **If issues:** Check troubleshooting section and review relevant files
3. **For production:** Run full test suite in GST_IMPLEMENTATION_TEST_PLAN.md
4. **For documentation:** Share GST_IMPLEMENTATION_SUMMARY.md with team

---

## Questions?

Refer to:
- `GST_IMPLEMENTATION_SUMMARY.md` - Detailed technical documentation
- `GST_IMPLEMENTATION_TEST_PLAN.md` - Comprehensive test scenarios
- Code comments in modified files
