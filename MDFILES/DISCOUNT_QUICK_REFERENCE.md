# Discount Management - Quick Reference Guide

## 🚀 Quick Setup Examples

### 1. Store-Wide 20% Off Sale
```
Name: Summer Campaign 2026
Type: Percentage
Value: 20
Scope: All Products
Duration: 30 days
Activation: Immediate
```

### 2. Buy More, Save More
```
Name: Volume Discount 50+ Items
Type: Fixed Amount
Value: 500
Scope: All Products
Min Purchase: 2500 (triggers after ৳2500)
Usage Limit: Unlimited
```

### 3. Category Promotion - New Arrivals
```
Name: New Arrivals 15% Off
Type: Percentage
Value: 15
Scope: Specific Categories
Categories: New Arrivals
Min Purchase: 1000
Duration: 14 days
```

### 4. Exclusive Product Flash Sale
```
Name: Flash Sale - 40% Off Selected
Type: Percentage
Value: 40
Scope: Specific Products
Products: Choose clearance items
Duration: 12 hours
Usage Limit: First 50 transactions
Max Discount: 5000
```

### 5. Loyalty Reward
```
Name: Regular Customer Welcome
Type: Fixed Amount
Value: 100
Scope: All Products
Usage Limit: 1 (one-time per customer)
Min Purchase: 800
```

## 📊 Discount Status Indicators

| Status | Meaning | What to Do |
|--------|---------|-----------|
| ✓ Active | Currently valid and active | Monitor usage |
| ⏱ Upcoming | Scheduled for future | Wait for activation date |
| ✕ Expired | Past end date | Archive or update dates |
| ⊘ Inactive | Manually disabled | Reactivate or delete |

## 💡 Common Scenarios & Solutions

### Scenario 1: Flash Sale Ending Soon
**Problem**: Discount expires in 1 hour but not all stock cleared

**Solution**:
1. Open discount card
2. Click "Edit"
3. Extend end date
4. Increase usage limit if needed
5. Save

### Scenario 2: Popular Discount Running Out of Limit
**Problem**: Discount used 48/50 times, very close to limit

**Solution**:
1. Edit the discount
2. Increase usage limit (e.g., 50 → 100)
3. Update end date to extend promotion
4. Save and notify customers

### Scenario 3: Need to Pause Discount Early
**Problem**: Discount approved but needs to be temporarily disabled

**Solution**:
1. Find discount card
2. Click "⊘ Deactivate" button
3. Later, click "✓ Activate" to resume
4. No data is lost, just toggled

### Scenario 4: Wrong Discount Amount Set
**Problem**: Discount was set to 30% but should be 25%

**Solution**:
1. Click "Edit" on discount card
2. Change value from 30 to 25
3. Save
4. Changes apply immediately to new transactions

### Scenario 5: Check How Much Discount Saved
**Problem**: Need to know total savings from a discount

**Solution**:
1. Go to Statistics tab
2. Find discount in list
3. Check "Usage" field
4. Calculate: Usage Count × Average Discount Amount

## 🛒 POS Integration Tips

### Applying Discount at Checkout
1. Add items to cart
2. Review subtotal
3. Look for "Apply Discount" button
4. Select from available discounts
5. System auto-calculates savings
6. Review final amount
7. Process payment

### Viewing Discount Info
- Discount name appears in receipt
- Discount amount shown clearly
- Final total reflects discount
- Customer can see exactly what they saved

## 📈 Monitoring Discounts

### Daily Tasks
- Check active discounts
- Monitor usage approaching limits
- Look for discounts expiring soon

### Weekly Tasks
- Review discount effectiveness
- Check if limits need adjustment
- Plan upcoming promotions

### Monthly Tasks
- Analyze discount ROI
- Identify most popular discounts
- Plan seasonal promotions
- Archive expired discounts

## ⚡ Performance Tips

### For Best Results
1. **Don't** create too many overlapping discounts
2. **Do** set clear end dates
3. **Don't** use complex scope (prefer simple scopes)
4. **Do** regularly archive old discounts
5. **Don't** forget to deactivate instead of delete
6. **Do** test discount before wide release

### Optimization
- Use "All Products" scope when possible
- Batch similar discounts into one
- Set reasonable usage limits
- Archive discounts older than 60 days

## 🔒 Admin Functions

### Reset Usage Counter (Admin Only)
```
Use Case: Discount limit needs reset
Action: Open discount, click "Reset Usage"
Effect: Usage count goes to 0
Warning: Cannot be undone
```

### Bulk Discount Operations
```
Scenario: Need to apply same discount to many products
Solution: Use "Apply Discount to Multiple Products"
Result: Creates single discount for selected items
```

## 📱 Mobile Responsiveness

All discount features work perfectly on mobile:
- ✓ View discounts on phone
- ✓ Create discounts (slower, use desktop for complex ones)
- ✓ Edit basic info
- ✓ Toggle status
- ✓ Check statistics

## 🆘 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Discount not showing up | Check: Active status, date range, scope |
| Wrong discount amount | Verify: Min purchase met, max discount limit, scope applies |
| Usage limit exceeded | Edit discount: Increase limit or extend date |
| Can't find discount | Check: Status tab, search by name, verify date range |
| Discount disappeared | Check: Expiration date, inactive status, deleted |

## 💰 Pricing Strategy Examples

### Strategy 1: Loss Leader
```
Goal: Attract customers with great deal
Discount: 50% off selected items
Strategy: Offer on popular but low-margin items
Expected: Increased store traffic
```

### Strategy 2: Volume Discount
```
Goal: Increase average order value
Discount: 10% over ৳2000, 15% over ৳5000
Strategy: Encourage larger purchases
Expected: Higher revenue per transaction
```

### Strategy 3: Seasonal Clearance
```
Goal: Clear old stock quickly
Discount: 30-50% tiered by age
Strategy: Most aggressive on oldest stock
Expected: Rapid inventory turnover
```

### Strategy 4: Customer Retention
```
Goal: Keep loyal customers
Discount: Exclusive deals via email
Strategy: Regular small discounts
Expected: Repeat purchases
```

## 📋 Discount Checklist

Before Creating a Discount:
- [ ] Discount name is clear
- [ ] Discount amount calculated correctly
- [ ] Start and end dates set
- [ ] Scope is appropriate
- [ ] Min/max amounts considered
- [ ] Usage limit determined
- [ ] Tested in sandbox (if critical)
- [ ] Communicated to staff

## 🎯 Success Metrics

Track these KPIs:
- **Redemption Rate**: How many customers use the discount
- **Revenue Impact**: Total revenue from discounted transactions
- **AOV Increase**: Average Order Value increase
- **Customer Acquisition**: New customers from discount
- **Repeat Purchase**: Customers returning after discount
- **Margin Protection**: Discounts don't exceed margin target

---

**Need Help?** See DISCOUNT_MANAGEMENT_GUIDE.md for complete documentation
