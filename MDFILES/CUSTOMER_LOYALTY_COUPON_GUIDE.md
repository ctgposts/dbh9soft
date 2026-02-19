# Customer Loyalty & Coupon System - Complete Implementation Guide

## 🎯 Overview

This is a comprehensive 360-degree Customer Loyalty & Coupon Management System fully integrated into the Dubai Borka House retail platform. The system provides advanced features for customer retention, reward programs, and promotional campaign management.

## ✨ Key Features

### 1. **Customer Loyalty Program**
- **Points-Based System**: Customers earn points for every purchase
- **Tier System**: Bronze, Silver, Gold, and Platinum membership tiers
- **Tier Benefits**:
  - Automatic tier progression based on accumulated points
  - Tiered discounts on purchases
  - Bonus points multipliers for higher tiers
  - Special tier-specific benefits and perks
- **Membership Management**:
  - Unique referral codes for each member
  - Comprehensive membership dashboard
  - Birthday rewards and special bonuses
  - Last activity tracking

### 2. **Advanced Coupon Management**
- **Multiple Discount Types**:
  - Percentage-based discounts
  - Fixed amount discounts
  - Free shipping rewards
  - Loyalty points bonuses
- **Smart Restrictions**:
  - Minimum order amount requirements
  - Maximum discount caps
  - Per-customer usage limits
  - Global usage limits
  - Loyalty tier requirements
  - Loyalty points requirements
- **Flexible Applicability**:
  - Apply to all products
  - Category-specific discounts
  - Specific product targeting
  - Branch-specific coupons
- **Scheduling**:
  - Validity date ranges
  - Automatic expiration
  - Upcoming promotion previews

### 3. **Referral Program**
- **Referral Tracking**: Track customer referrals with unique codes
- **Bonus Rewards**: Award points when referred customers make purchases
- **Status Management**: Pending, completed, and cancelled referrals
- **Analytics**: View number of successful referrals per customer

### 4. **Points Transaction System**
- **Transaction Types**:
  - Purchase points (automatic)
  - Redemption points (customer uses points)
  - Bonus points (referral rewards, promotions)
  - Refund adjustments
  - Manual adjustments (admin)
- **Complete History**: Full audit trail of all point transactions
- **Real-Time Updates**: Points updated immediately after purchase

### 5. **Analytics & Reporting**
- **Loyalty Statistics**:
  - Total loyalty members
  - Tier distribution
  - Points issued vs. redeemed
  - Active coupon count
- **Customer Rankings**: Top customers by loyalty points
- **Coupon Performance**: Usage rates and effectiveness metrics
- **Referral Analytics**: Referral success rates

## 🗄️ Database Schema

### New Tables Created

#### 1. **loyaltyPrograms**
Stores loyalty program configuration and tier definitions.
```
{
  name: string
  description: optional string
  pointsPerDollar: number
  isActive: boolean
  tiers: [
    {
      name: string ("Bronze", "Silver", "Gold", "Platinum")
      minPoints: number
      discountPercentage: number
      bonusPointsMultiplier: number
      benefits: [string]
    }
  ]
  createdAt: number
}
```

#### 2. **customerLoyalty**
Main customer loyalty account information.
```
{
  customerId: Id<"customers">
  customerName: string
  email: optional string
  phone: optional string
  totalPoints: number
  availablePoints: number
  redeemedPoints: number
  currentTier: string
  tierUpgradeDate: optional number
  membershipDate: number
  lastActivityDate: number
  totalSpent: number
  totalOrders: number
  birthDate: optional number
  referralCode: string
  referredCustomers: [Id<"customers">]
  isActive: boolean
}
```

#### 3. **pointsTransactions**
Complete audit trail of loyalty points.
```
{
  customerId: Id<"customers">
  customerName: string
  transactionType: string ("purchase", "redemption", "bonus", "refund", "referral", "adjustment")
  points: number (positive or negative)
  description: string
  referenceId: optional Id<"sales">
  branchId: optional Id<"branches">
  branchName: optional string
  createdAt: number
  createdBy: optional Id<"users">
  notes: optional string
}
```

#### 4. **advancedCoupons**
Enhanced coupon management with advanced features.
```
{
  code: string (uppercase, unique)
  description: optional string
  discountType: string ("percentage", "fixed", "points", "free_shipping")
  discountValue: number
  minOrderAmount: optional number
  maxDiscountAmount: optional number
  usagePerCustomer: optional number (default: 1)
  maxUsageCount: optional number
  usageCount: number
  validFrom: number
  validUntil: number
  isActive: boolean
  applicableProducts: optional [Id<"products">]
  applicableCategories: optional [Id<"categories">]
  applicableBranches: optional [Id<"branches">]
  loyaltyTiersRequired: optional [string]
  requiresLoyaltyPoints: optional number
  createdBy: Id<"users">
  createdByName: string
  createdAt: number
  usedBy: [
    {
      customerId: Id<"customers">
      customerName: string
      usageCount: number
      lastUsedAt: number
    }
  ]
}
```

#### 5. **couponRedemptions**
Complete history of coupon usage.
```
{
  couponId: Id<"advancedCoupons">
  couponCode: string
  customerId: Id<"customers">
  customerName: string
  saleId: optional Id<"sales">
  discountAmount: number
  pointsEarned: optional number
  pointsRedeemed: optional number
  branchId: Id<"branches">
  branchName: string
  redeemedAt: number
  employeeId: optional Id<"employees">
  employeeName: optional string
}
```

#### 6. **referralProgram**
Referral program tracking.
```
{
  referrerId: Id<"customers">
  referrerName: string
  referrerPhone: optional string
  referredCustomerId: optional Id<"customers">
  referredName: optional string
  referredPhone: optional string
  referralCode: string
  status: string ("pending", "completed", "cancelled")
  bonusPointsOffered: number
  bonusPointsAwarded: number
  referredAt: number
  completedAt: optional number
  firstPurchaseAmount: optional number
}
```

## 🔌 API Endpoints

### Loyalty Program Management

#### `getAllPrograms()`
**Query** - Get all loyalty programs
- **Returns**: Array of loyalty program objects
- **Usage**: Load available programs for configuration

#### `createProgram(args)`
**Mutation** - Create new loyalty program
- **Args**:
  - `name: string` - Program name
  - `description?: string` - Program description
  - `pointsPerDollar: number` - Points earned per dollar spent
  - `tiers: Tier[]` - Tier definitions
- **Returns**: Created program object
- **Auth Required**: Yes

### Customer Loyalty Account

#### `initializeLoyaltyAccount(args)`
**Mutation** - Create loyalty account for customer
- **Args**:
  - `customerId: Id<"customers">` - Customer ID
  - `customerName: string` - Customer name
  - `email?: string` - Email
  - `phone?: string` - Phone number
  - `birthDate?: number` - Birth date timestamp
- **Returns**: Created loyalty account
- **Auto-generates**: Unique referral code
- **Auth Required**: Yes

#### `getCustomerLoyalty(args)`
**Query** - Get customer loyalty account
- **Args**:
  - `customerId: Id<"customers">` - Customer ID
- **Returns**: Loyalty account object or null

#### `addPointsForPurchase(args)`
**Mutation** - Award points for purchase
- **Args**:
  - `customerId: Id<"customers">` - Customer ID
  - `purchaseAmount: number` - Purchase amount in dollars
  - `saleId?: Id<"sales">` - Related sale ID
  - `branchId?: Id<"branches">` - Branch ID
  - `branchName?: string` - Branch name
- **Returns**: `{ success: boolean, pointsEarned: number, newTotalPoints: number, newTier: string }`
- **Auto-updates**: Tier if threshold crossed
- **Auto-records**: Transaction entry
- **Auth Required**: Yes

#### `redeemPoints(args)`
**Mutation** - Redeem loyalty points
- **Args**:
  - `customerId: Id<"customers">` - Customer ID
  - `pointsToRedeem: number` - Points to redeem
  - `reason: string` - Redemption reason
- **Returns**: `{ success: boolean, remainingPoints: number }`
- **Validation**: Checks sufficient points
- **Auth Required**: Yes

#### `getPointsTransactions(args)`
**Query** - Get customer points history
- **Args**:
  - `customerId: Id<"customers">` - Customer ID
  - `limit?: number` - Results limit (default: 50)
- **Returns**: Array of transaction objects

### Coupon Management

#### `createAdvancedCoupon(args)`
**Mutation** - Create new coupon
- **Args**:
  - `code: string` - Unique coupon code (uppercase)
  - `description?: string` - Coupon description
  - `discountType: string` - Type of discount
  - `discountValue: number` - Discount amount/percentage
  - `minOrderAmount?: number` - Minimum order requirement
  - `maxDiscountAmount?: number` - Maximum discount cap
  - `usagePerCustomer?: number` - Max uses per customer
  - `maxUsageCount?: number` - Global usage limit
  - `validFrom: number` - Start date timestamp
  - `validUntil: number` - End date timestamp
  - `applicableProducts?: Id<"products">[]` - Applicable products
  - `applicableCategories?: Id<"categories">[]` - Applicable categories
  - `applicableBranches?: Id<"branches">[]` - Applicable branches
  - `loyaltyTiersRequired?: string[]` - Required loyalty tiers
  - `requiresLoyaltyPoints?: number` - Minimum loyalty points needed
- **Returns**: Created coupon object
- **Validation**: Unique code check
- **Auth Required**: Yes

#### `getAllCoupons(args)`
**Query** - Get all coupons
- **Args**:
  - `status?: string` - Filter: "active", "expired", "upcoming"
- **Returns**: Array of coupon objects
- **Auto-filters**: Based on status parameter

#### `validateCouponForCustomer(args)`
**Query** - Validate coupon applicability
- **Args**:
  - `code: string` - Coupon code
  - `customerId: Id<"customers">` - Customer ID
  - `orderAmount: number` - Order total
  - `productIds?: Id<"products">[]` - Products in order
- **Returns**: `{ valid: boolean, reason?: string, couponId?: Id, discountAmount?: number, discountType?: string }`
- **Checks**: All restrictions and requirements
- **Auth Required**: No

#### `applyCoupon(args)`
**Mutation** - Apply coupon to sale
- **Args**:
  - `couponId: Id<"advancedCoupons">` - Coupon ID
  - `customerId: Id<"customers">` - Customer ID
  - `saleId?: Id<"sales">` - Related sale
  - `discountAmount: number` - Calculated discount
  - `branchId: Id<"branches">` - Branch ID
  - `branchName: string` - Branch name
  - `pointsToRedeem?: number` - Points to redeem
- **Returns**: `{ success: boolean, redemptionId: Id }`
- **Updates**: Coupon usage tracking
- **Records**: Redemption history
- **Auth Required**: Yes

### Referral Program

#### `createReferral(args)`
**Mutation** - Create referral
- **Args**:
  - `referrerId: Id<"customers">` - Referrer customer ID
  - `referrerName: string` - Referrer name
  - `referrerPhone?: string` - Referrer phone
  - `referredName: string` - Referred person name
  - `referredPhone?: string` - Referred person phone
  - `bonusPoints: number` - Bonus points to award
- **Returns**: Created referral object
- **Generates**: Unique referral code
- **Auth Required**: Yes

#### `completeReferral(args)`
**Mutation** - Mark referral as completed
- **Args**:
  - `referralId: Id<"referralProgram">` - Referral ID
  - `referredCustomerId: Id<"customers">` - Referred customer ID
  - `firstPurchaseAmount: number` - First purchase amount
- **Returns**: `{ success: boolean, bonusPointsAwarded: number }`
- **Awards**: Bonus points to referrer
- **Records**: Transaction entry
- **Auth Required**: Yes

### Analytics

#### `getLoyaltyStats(args)`
**Query** - Get loyalty program statistics
- **Returns**:
  ```
  {
    totalMembers: number
    tierDistribution: { Bronze: number, Silver: number, Gold: number, Platinum: number }
    totalPointsIssued: number
    totalPointsRedeemed: number
    activeCoupons: number
  }
  ```

#### `getTopCustomers(args)`
**Query** - Get top customers by loyalty points
- **Args**:
  - `limit?: number` - Number of customers (default: 10)
- **Returns**: Array of top loyalty accounts

## 🎨 Frontend Components

### CustomerLoyalty Component

Complete loyalty management interface accessible from Settings → "Loyalty & Rewards" tab.

**Features**:
- **Overview Tab**:
  - Gradient loyalty card showing tier and points
  - Member statistics (total points, available, spent)
  - Referral code with copy-to-clipboard
  - Quick action buttons
- **Points History Tab**:
  - Chronological transaction list
  - Color-coded transaction types (gain/loss)
  - Transaction descriptions and dates
- **Tier Benefits Tab**:
  - Tier progression display
  - Tier requirements and benefits
  - Current tier highlighting
- **Referral Program Tab**:
  - Referral code display
  - Create new referral button
  - List of referred customers
  - Referral statistics

**Statistics Cards**:
- Total Members
- Active Coupons
- Points Issued
- Points Redeemed

**Top Customers Section**:
- Ranked list of top 5 customers
- Points and tier display
- Quick reference for rewards

### CouponManagement Component

Advanced coupon management interface accessible from Settings → "Coupons" tab.

**Tabs**:
- **All Coupons**: Complete coupon inventory
- **Active**: Currently active promotions only
- **Upcoming**: Future promotions preview
- **Statistics**: Analytics and performance metrics

**Features per Tab**:

1. **All/Active/Upcoming**:
   - Search and filter functionality
   - Coupon cards with:
     - Code and description
     - Discount display
     - Status badge (Active/Expired/Upcoming/Inactive)
     - Usage progress bar
     - Min order, validity dates, creator info
     - Tags showing restrictions (tiers, categories, products)
   - Detailed coupon information

2. **Statistics Tab**:
   - Discount type distribution chart
   - Overall usage rate percentage
   - Top performing coupons
   - Usage trends

3. **Create Coupon Modal**:
   - Basic info: code, type, description
   - Discount configuration
   - Usage limits
   - Validity dates
   - Loyalty tier requirements
   - Loyalty points requirements

## 📊 Integration Points

### With POS System
- Automatic points calculation during checkout
- Real-time coupon validation
- Coupon application in final total
- Points redemption at point of sale

### With Sales Module
- Points awarded automatically after sale
- Coupon redemptions linked to sale records
- Sale amount used for tier progression

### With Customers Module
- Loyalty account auto-initialized for new customers
- Referral code displayed in customer profiles
- Points and tier shown in customer view

### With Online Store
- Coupon validation for online orders
- Points earned for online purchases
- Digital coupon delivery

### With WhatsApp Orders
- Coupon code validation
- Points calculation
- Loyalty status verification

## 🔐 Security & Permissions

- **Authentication Required**: All mutations require authenticated user
- **Audit Trail**: All transactions recorded with user ID and timestamp
- **Validation**: Comprehensive checks on all discount applications
- **Uniqueness**: Coupon codes enforced as unique
- **Type Safety**: Full TypeScript support throughout

## 📈 Business Logic

### Points Calculation
```
Points Earned = Purchase Amount × Points Per Dollar × Tier Multiplier

Example: $100 purchase with 1 point/$, Bronze tier (1x multiplier)
= 100 × 1 × 1 = 100 points
```

### Tier Progression
Tiers auto-update based on total points. Example tier structure:
- **Bronze**: 0+ points (1x multiplier, 0% discount)
- **Silver**: 500+ points (1.25x multiplier, 5% discount)
- **Gold**: 1000+ points (1.5x multiplier, 10% discount)
- **Platinum**: 2000+ points (2x multiplier, 15% discount)

### Coupon Validation Chain
1. Check coupon exists and is active
2. Verify date validity (validFrom ≤ now ≤ validUntil)
3. Check usage limits (global and per-customer)
4. Verify minimum order amount
5. Check loyalty tier requirements
6. Check loyalty points requirements
7. Verify product/category applicability
8. Calculate final discount amount
9. Apply maximum discount cap if configured

### Referral Completion
Referral status changes to "completed" when referred customer makes first purchase, triggering:
1. Bonus points awarded to referrer
2. Transaction logged for referrer
3. Referred customer added to referrer's list
4. First purchase amount recorded

## 🚀 Usage Examples

### Example 1: Customer Makes Purchase
```
1. Customer completes $150 purchase
2. System calls addPointsForPurchase({
     customerId: "customer123",
     purchaseAmount: 150,
     saleId: "sale456"
   })
3. Points calculated: 150 × 1 × 1.5 (Gold tier) = 225 points
4. Customer total: 1200 + 225 = 1425 points
5. Transaction recorded automatically
```

### Example 2: Customer Uses Coupon
```
1. Customer tries to apply "SUMMER20" coupon
2. System validates:
   - Code exists and active ✓
   - Customer not used before ✓
   - Order $150 > min $100 ✓
   - Customer is Gold tier (required) ✓
3. Discount calculated: $150 × 20% = $30
4. Final total: $150 - $30 = $120
5. Coupon applied to sale
```

### Example 3: Referral Bonus
```
1. Customer A creates referral for Customer B
2. Bonus: 100 points offered
3. Customer B makes first $200 purchase
4. System calls completeReferral()
5. Customer A awarded 100 points
6. Transaction recorded for Customer A
```

## 📱 Mobile & Responsive Design

- Fully responsive layouts
- Mobile-optimized cards and forms
- Touch-friendly button sizes
- Optimized for all screen sizes

## ⚙️ Configuration

### Default Loyalty Program
Points per Dollar: 1
Tiers: Bronze, Silver, Gold, Platinum (customizable)

### Coupon Defaults
Usage per Customer: 1 (customizable)
Max Usage: Unlimited if not specified

## 🔄 Maintenance & Updates

### Regular Tasks
- Monitor coupon expiration dates
- Review loyalty tier thresholds
- Analyze referral program effectiveness
- Track points issued vs. redeemed ratio

### Performance Optimization
- Indexed queries on frequently filtered fields
- Points transactions archived after 1 year (optional)
- Coupon usage cached in usedBy array

## 📝 Audit & Compliance

- All transactions recorded with timestamp
- User ID tracked for all mutations
- Complete redemption history
- Referral tracking with dates
- Coupon usage per customer tracked

## 🎓 Best Practices

1. **Tier Thresholds**: Set realistic progression to maintain engagement
2. **Coupon Duration**: Launch campaigns 2-4 weeks before promotion
3. **Point Values**: Keep points redemption attainable (200-500 points for rewards)
4. **Referral Bonus**: 5-10% of typical customer value
5. **Marketing**: Email loyalty members about new coupons
6. **Analytics**: Review monthly performance metrics

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Customer not getting points | Check sale was recorded and points mutation executed |
| Coupon code error | Verify code is uppercase and unique |
| Tier not updating | Check points total and tier thresholds |
| Referral not completing | Verify referred customer made purchase and status updated |

## 📞 Support

For implementation questions or issues:
1. Check backend logs for mutation errors
2. Verify database indexes are created
3. Confirm user authentication on mutations
4. Review TypeScript types in API

---

**System Status**: ✅ **360° Fully Functional**

All components integrated, tested, and production-ready.
