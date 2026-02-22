# Undo Sale - Quick Start Guide

## What is "Undo Sale"?

**Undo Sale** is a complete transaction reversal feature. When you complete a refund, the entire original sale is completely reversed:

- ❌ Sale cancelled and hidden from sales list
- 💰 Payment reversal documented  
- 📦 All products restored to inventory
- ⭐ Loyalty points reversed
- 💳 Discounts & taxes reversed
- 📋 Complete audit trail created

---

## How to Use

### 1. In Refund Management
1. Open the refund that needs to be completed
2. Click **"Complete Refund"** button
3. Enter return condition (Good/Fair/Damaged)
4. Add inspection notes if needed
5. Confirm completion

### 2. What Happens Automatically
✅ Sale marked as "cancelled"  
✅ Payment of $X reversed  
✅ Y products returned to stock  
✅ Z loyalty points reversed  
✅ Complete audit trail created  

### 3. Verify the Undo
**Check Sales List:**
- Original sale no longer appears (marked as cancelled)

**Check Inventory:**
- Refunded products are back with correct quantity

**Check Customer Profile:**
- Loyalty points decreased back
- Previous order amount adjusted

**Check Refund Audit Trail:**
- See all reversals documented with amounts

---

## Key Differences

| Feature | Before Undo Sale | After Undo Sale |
|---------|-----------------|-----------------|
| Sale appears in sales list | ❌ Hidden as "returned" | ❌ Hidden as "cancelled" |
| Inventory | ✅ Restored | ✅ Restored |
| Loyalty Points | ❌ Not reversed | ✅ Reversed |
| Payment | ❌ Not documented | ✅ Documented as reversed |
| Audit Trail | ⚠️ Basic | ✅ Comprehensive |

---

## Status Indicators

### Sales Status
- **Active sales:** completed, partial, pending
- **Cancelled sales:** "cancelled" (undo sale) or "returned" (old format)

### Refund Status
- **In Progress:** pending → approved → processed
- **Completed:** "completed" (undo sale finished)

---

## Audit Trail Details

Click **View Audit Trail** in the refund to see:

```
✅ UNDO SALE COMPLETED
- Sale #SAL-2024-001 marked as cancelled
- Payment of $500.00 reversed
- 3 items restored to inventory
- 50 loyalty points reversed
- $50 discount reversal included
- $75 tax reversal included
- Completed by: John Doe
- Date: 2024-01-15 14:30
```

---

## Payment Reversal Flow

1. **Sale Created:** Customer pays $500
   - Recorded in original sale

2. **Refund Requested:** Customer returns items

3. **Refund Completed (Undo Sale):**
   - Payment reversal documented: -$500
   - Audit trail shows: "Payment reversal for sale #SAL-2024-001"
   - Tells accounting: refund of $500 needs to be processed

4. **Actual Refund:** Cash/bank transfer processed manually (follow your payment gateway process)

---

## Inventory Restoration

When you complete a refund:

1. **Stock Movement Created:**
   - Type: "In" (stock coming back)
   - Reference: Refund number
   - Quantity: Number of items refunded

2. **Product Stock Updated:**
   - Global stock increased
   - Branch stock updated if applicable
   - Product marked as "active"

3. **Verification:**
   - Check inventory report
   - Look for stock movements with reason "Undo Sale Return"
   - Verify quantities match refund items

---

## Loyalty Points

### Before Refund
- Customer has: 1000 points
- Earned from this sale: 50 points

### After Undo Sale Completed
- Customer has: 950 points
- Points transaction created: "refund" type, -50 points
- Full history preserved

### Benefits
- Customers don't keep points they shouldn't
- Fair loyalty system
- Complete audit trail of point changes

---

## Common Scenarios

### Scenario 1: Customer Changes Mind
1. Sale completed 2 weeks ago
2. Customer requests return
3. You process refund → Undo Sale
4. ✅ Everything reversed
5. ✅ Product back in stock
6. ✅ Points returned
7. ✅ Payment documented for reversal

### Scenario 2: Defective Product
1. Product found defective
2. Create refund request
3. Complete refund → Undo Sale
4. ✅ Sale cancelled
5. ✅ Product restored
6. ✅ Can be sold to someone else
7. ✅ No duplicate orders in system

### Scenario 3: Partial Refund
1. Sale had 5 items
2. Customer returns 2 items
3. Create refund for 2 items
4. Complete refund → Undo Sale
5. ✅ Only those 2 items restored
6. ✅ Partial points reversed
7. ✅ Sale adjusted accordingly

---

## Troubleshooting

### Issue: "Payment Reversal" not showing
**Solution:** Check refund audit trail, payment reversal is documented there with exact amount

### Issue: Inventory not updated
**Solution:** 
- Check that "Restock Required" is enabled in refund
- Verify stock movements were created
- Check inventory report for stock movement entries

### Issue: Loyalty points not reversed
**Solution:**
- Check if customer has loyalty points enabled
- Look in pointsTransactions table for "refund" entries
- Verify customer loyalty points balance was updated

### Issue: Sale still visible in sales list
**Solution:**
- Refresh the page
- Sale with status "cancelled" should be hidden by default
- Use filter to show all sales if needed

---

## Reports & Analytics

### Refund Reports
- See all completed refunds (Undo Sales)
- Track refund reasons
- Identify problem products
- Monitor refund rates

### Sales Reports
- Cancelled/returned sales excluded by default
- Can include them with filter if needed
- Accurate revenue calculations (excludes cancelled sales)

### Inventory Reports
- Stock movements show all undo sales
- Full audit trail of restocks
- Identify problematic stock levels

### Customer Reports
- Loyalty points adjustments visible
- Complete refund history
- Refund frequency per customer

---

## Best Practices

✅ **DO:**
- Document return condition (Good/Fair/Damaged)
- Add inspection notes for defective items
- Review audit trail after completing
- Check inventory was restored
- Monitor loyalty points changes

❌ **DON'T:**
- Skip return condition selection
- Complete refund without checking items
- Manually adjust stock after undo sale
- Create duplicate refund entries

---

## Support & Escalation

If refund cannot be completed:
1. Check all validation errors
2. Review refund status flow
3. Ensure sale exists and is not already cancelled
4. Contact system administrator if issues persist

---

## Summary

**Undo Sale** gives you complete control:
- ✅ Sales are fully reversed (not just hidden)
- ✅ All financial impacts documented
- ✅ Inventory completely restored
- ✅ Loyalty points corrected
- ✅ Full audit trail for compliance
- ✅ Zero data inconsistencies

This ensures your inventory, sales, and loyalty systems remain accurate and trustworthy.
