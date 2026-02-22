# 🎁 Discount Management System - Complete Documentation

## Overview

The Discount Management System is a comprehensive, fully-functional solution for managing promotions, discounts, and pricing strategies across your entire e-commerce and retail platform. It integrates seamlessly with POS, Sales, WhatsApp Orders, and Online Store modules.

## 360-Degree Functionality

### 1. **Core Features**

#### ✅ Discount Creation & Management
- **Percentage Discounts**: Apply percentage-based discounts (e.g., 10%, 25%)
- **Fixed Amount Discounts**: Apply fixed amounts (e.g., ৳100, ৳500)
- **Multiple Scopes**:
  - All Products
  - Specific Categories
  - Specific Products

#### ✅ Date & Time Management
- **Start Date**: When the discount becomes active
- **End Date**: When the discount expires
- **Automatic Activation**: Discounts automatically activate/expire based on dates
- **Date Validation**: System prevents application of expired or future discounts

#### ✅ Usage Tracking & Limits
- **Usage Limit**: Set maximum number of times a discount can be used
- **Usage Counter**: Automatically increments with each application
- **Usage Progress**: Visual progress bar showing usage percentage
- **Limit Enforcement**: Prevents application when limit is reached

#### ✅ Purchase Constraints
- **Minimum Purchase Amount**: Set minimum cart value to qualify
- **Maximum Discount Amount**: Cap the maximum discount per transaction
- **Smart Validation**: Automatic validation of all constraints

#### ✅ Discount Status Management
- **Active/Inactive**: Toggle discount status without deletion
- **Status Indicators**: 
  - ✓ Active (currently valid)
  - ⏱ Upcoming (future activation)
  - ✕ Expired (past end date)
  - ⊘ Inactive (manually disabled)

### 2. **Dashboard & Analytics**

#### Statistics Dashboard
- **Total Discounts**: Count of all discounts
- **Active Now**: Number of currently valid discounts
- **Upcoming**: Discounts scheduled for future
- **Expired**: Past discounts
- **Total Usage**: Combined usage across all discounts
- **Average Usage**: Average usage per discount

#### Visualization
- Color-coded status badges
- Usage progress bars
- Quick stats cards
- Tabbed interface

### 3. **Advanced Features**

#### ✅ Discount Utils (Backend)

**Get Applicable Discounts**
```typescript
api.discountUtils.getApplicableDiscounts({
  productId,
  branchId,
  subtotal
})
```

**Calculate Cart Discount**
```typescript
api.discountUtils.calculateCartDiscount({
  discountId,
  cartItems,
  subtotal
})
```

**Get Best Discount**
- Automatically finds the discount that saves the most money
- Respects all constraints and limits
- Perfect for suggesting best deals to customers

**Apply Discount**
- Increments usage counter
- Enforces usage limits
- Prevents double application

#### ✅ Bulk Operations
- **Apply Discount to Multiple Products**: Quick promotions across many products
- **Flash Sales**: Time-limited discounts on specific items
- **Category-Wide Discounts**: Promote entire categories
- **Bulk Price Updates**: Adjust prices for multiple items at once

### 4. **Integration Points**

#### 🛒 POS Integration
```typescript
// In checkout:
const discountAmount = (subtotal * discount) / 100;
const total = subtotal - discountAmount;
```

#### 📦 Sales Module Integration
```typescript
// Sales transaction includes:
{
  discount: discountAmount,  // Amount discounted
  total: finalAmount,        // After discount
  paidAmount, dueAmount     // Payment tracking
}
```

#### 🛍️ Online Store Integration
- Discounts apply to online products
- Automatic calculation during checkout
- Customer-facing discount information

#### 💬 WhatsApp Orders Integration
- Apply discounts to WhatsApp orders
- Automatic calculation
- Customer notification of discount applied

### 5. **Discount Types & Examples**

#### Percentage Discounts
```
Name: Summer Sale 20%
Type: Percentage
Value: 20
Calculation: Subtotal × 20 ÷ 100 = Discount
Example: ৳1000 × 20 ÷ 100 = ৳200 discount
```

#### Fixed Amount Discounts
```
Name: Clearance Flat ৳500
Type: Fixed Amount
Value: 500
Calculation: Flat ৳500 off
Example: ৳1000 - ৳500 = ৳500 final
```

### 6. **Use Cases**

#### Seasonal Promotions
```
Name: Eid Special
Type: Percentage (25%)
Scope: All Products
Duration: 7 days
Min Purchase: ৳500
Max Discount: ৳2000
```

#### Category-Specific Discounts
```
Name: Summer Collection Sale
Type: Percentage (30%)
Scope: Specific Categories (Summer Wear)
Duration: 30 days
```

#### Product-Level Discounts
```
Name: Clearance - Old Stock
Type: Percentage (50%)
Scope: Specific Products (Selected items)
Duration: Until stock clears
Usage Limit: Unlimited
```

#### New Customer Incentive
```
Name: Welcome Bonus
Type: Fixed Amount (৳200)
Scope: All Products
Min Purchase: ৳1000
Usage Limit: 1 (one-time per customer)
```

#### Flash Sales
```
Name: Friday Flash Sale
Type: Percentage (40%)
Scope: All Products
Duration: 4 hours
Usage Limit: First 50 customers
```

### 7. **User Interface**

#### Main Screen
- **Header**: Dashboard title + Create button
- **Tabs**: All Discounts | Active Now | Statistics
- **Grid View**: Cards displaying discount info
- **Status Badges**: Color-coded status indicators

#### Discount Card
- **Name & Description**
- **Discount Value**: Visual highlight
- **Scope Info**: What products are included
- **Valid Dates**: Active period
- **Usage Progress**: Bar chart with percentage
- **Min/Max Constraints**: Purchase and discount limits
- **Action Buttons**:
  - Activate/Deactivate
  - Edit
  - Delete

#### Create/Edit Modal
- **Basic Info**: Name, description
- **Discount Type**: Percentage or fixed amount
- **Value**: The discount amount
- **Scope Selection**: All, categories, or products
- **Date Range**: Start and end dates
- **Constraints**: Min purchase, max discount, usage limit
- **Dynamic Selectors**: 
  - Category checkboxes (if scope = category)
  - Product checkboxes (if scope = specific products)

### 8. **Smart Calculations**

#### Percentage Discount
```
Formula: Subtotal × (Discount% / 100)
Example: ৳1000 × (20 / 100) = ৳200
```

#### Fixed Amount Discount
```
Formula: Fixed amount directly
Example: ৳500 flat discount
```

#### Constraint Application
```
1. Calculate base discount
2. Apply max discount limit (if set)
3. Ensure discount ≤ subtotal
4. Check min purchase requirement
5. Verify usage limit not exceeded
6. Validate date range
7. Check if scope applies
8. Return final discount amount
```

### 9. **API Reference**

#### Queries

**list** - Get all discounts
```typescript
api.discounts.list({ branchId?, isActive? })
```

**get** - Get single discount
```typescript
api.discounts.get({ id })
```

**getApplicableDiscounts** - Find discounts for a product
```typescript
api.discountUtils.getApplicableDiscounts({
  productId,
  branchId?,
  subtotal?
})
```

**calculateCartDiscount** - Calculate discount for a cart
```typescript
api.discountUtils.calculateCartDiscount({
  discountId,
  cartItems,
  subtotal
})
```

**getBestDiscount** - Find the best discount for a cart
```typescript
api.discountUtils.getBestDiscount({
  cartItems,
  subtotal,
  branchId?
})
```

**getDiscountStats** - Get analytics
```typescript
api.discountUtils.getDiscountStats({ branchId? })
```

**getDiscountsByStatus** - Filter by status
```typescript
api.discountUtils.getDiscountsByStatus({
  status: 'active' | 'expired' | 'upcoming' | 'inactive',
  branchId?
})
```

#### Mutations

**create** - Create new discount
```typescript
api.discounts.create({
  name, description, type, value, scope,
  categoryIds?, productIds?, branchIds?,
  startDate, endDate,
  usageLimit?, minPurchaseAmount?, maxDiscountAmount?
})
```

**update** - Update existing discount
```typescript
api.discounts.update({
  id, name, description, type, value, scope,
  categoryIds?, productIds?, branchIds?,
  startDate, endDate, isActive,
  usageLimit?, minPurchaseAmount?, maxDiscountAmount?
})
```

**remove** - Delete discount
```typescript
api.discounts.remove({ id })
```

**applyDiscount** - Apply discount (increment usage)
```typescript
api.discountUtils.applyDiscount({
  discountId,
  saleId?
})
```

**toggleDiscountStatus** - Enable/disable discount
```typescript
api.discountUtils.toggleDiscountStatus({
  discountId,
  isActive
})
```

**resetDiscountUsage** - Reset usage counter (admin only)
```typescript
api.discountUtils.resetDiscountUsage({ discountId })
```

### 10. **Integration Checklist**

- ✅ **POS Module**: Discounts apply to cart items
- ✅ **Sales Module**: Discount tracking in transactions
- ✅ **WhatsApp Orders**: Discount calculation
- ✅ **Online Store**: Discount application
- ✅ **Inventory**: Stock-independent discounts
- ✅ **Reports**: Discount usage analytics
- ✅ **Notifications**: Discount reminders
- ✅ **Multi-Branch**: Branch-specific discounts
- ✅ **Mobile**: Full mobile responsiveness
- ✅ **Performance**: Optimized queries and caching

### 11. **Best Practices**

1. **Date Management**
   - Always set end dates (prevent permanent active discounts)
   - Avoid overlapping discount periods for clarity
   - Use upcoming discounts for planning

2. **Usage Limits**
   - Set limits for exclusive/flash sales
   - Leave unlimited for regular promotions
   - Monitor usage regularly

3. **Constraints**
   - Use min purchase amounts to protect margins
   - Set max discount amounts for percentage discounts
   - Balance customer savings with profitability

4. **Scope Selection**
   - Use "All Products" for store-wide sales
   - Use "Category" for seasonal promotions
   - Use "Specific Products" for clearance

5. **Naming Convention**
   - Include sale name and duration: "Summer Sale 2026"
   - Include discount type: "25% Off" or "৳500 Flat"
   - Include eligibility: "All Items" or "New Arrivals"

### 12. **Troubleshooting**

| Issue | Solution |
|-------|----------|
| Discount not applying | Check date range and active status |
| Usage limit not working | Verify limit is set and less than current usage |
| Wrong discount amount | Check min/max constraints and scope |
| Performance issues | Archive old discounts, optimize queries |
| Limit exceeded | Reset usage counter or extend limit |

### 13. **Metrics & KPIs**

**Track These**
- Total discounts available
- Active discount count
- Total usage across all discounts
- Average discount value
- Usage rate vs. limit
- Customer redemption rate
- Revenue impact per discount

### 14. **Workflow Examples**

#### Creating a Store-Wide Sale
1. Go to Discount Management
2. Click "Create Discount"
3. Name: "Year-End Clearance"
4. Type: Percentage (30%)
5. Scope: All Products
6. Dates: Dec 20 - Dec 31
7. Min Purchase: ৳500
8. Max Discount: ৳5000
9. Create ✓

#### Activating an Upcoming Discount
1. Go to Statistics tab
2. Find upcoming discount
3. When ready, Edit the discount
4. Update start date to today
5. Save ✓

#### Managing Usage Limits
1. View active discounts
2. Check usage progress bar
3. If limit near: extend date or increase limit
4. If exceeded: create new discount or reset (admin)

## Summary

The Discount Management System provides complete control over all promotional activities with:
- ✅ Comprehensive discount types and scopes
- ✅ Smart calculation engine with constraints
- ✅ Usage tracking and limits
- ✅ Analytics and statistics
- ✅ Multi-module integration
- ✅ Professional UI with real-time updates
- ✅ Full API for custom implementations

This system is **360-degree fully functional** and ready for production use across all sales channels!
