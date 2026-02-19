# ✅ Product Addition Checklist

## Required Fields to Add a Product

### 1. **Basic Information** (All Required)
- [ ] **Product Name**: At least 2 characters
- [ ] **Fabric**: Must select from dropdown (Crepe, Chiffon, Georgette, etc.)

### 2. **At Least One Variant** (CRITICAL)
- [ ] **Color**: Must select from color list
- [ ] **Size**: Must select from size list (50", 52", 54", 56", 58", 60", 62")
- [ ] **Stock Quantity**: Must be greater than 0

### 3. **Pricing** (Required)
- [ ] **Cost Price (৳)**: Must be greater than 0
- [ ] **Selling Price (৳)**: Must be greater than 0 (cannot be 0 or empty)
  - *Previously the form allowed 0, but the API requires > 0*

### 4. **Optional Fields**
- Category (if categories exist)
- Style (defaults to "Dubai Style")
- Embellishments (Plain, Embroidered, etc.)
- Occasion (defaults to "Party Wear")
- Product Image (upload or URL)
- Description
- Minimum/Maximum Stock Levels

## Auto-Generated Fields (Do NOT edit)
- Brand: Automatically set to "DUBAI BORKA HOUSE"
- Made By: Automatically set to "U.A.E"
- Model: Auto-generated (e.g., RD-2026-0001)
- Product Code: Auto-generated from brand initials
- Barcode: Auto-generated with prefix

## Common Issues & Solutions

### ❌ "Please add at least one valid color/size/stock combination"
**Solution**: Add a variant with:
- ✅ Color selected
- ✅ Size selected (e.g., 52")
- ✅ Stock > 0

### ❌ "Selling price must be greater than 0"
**Solution**: Enter a selling price that is > 0 (cannot be 0 or empty)

### ❌ "Category selection is required"
**Solution**: Select a category from the dropdown, OR ask admin to create categories first

### ❌ "Cost price must be greater than 0"
**Solution**: Enter a cost price that is > 0

### ❌ "Selling price cannot be less than cost price"
**Solution**: Make sure: Selling Price ≥ Cost Price

## Example - Adding a Simple Product

1. **Product Name**: "Black Dubai Abaya"
2. **Fabric**: "Crepe"
3. **Cost Price**: 500
4. **Selling Price**: 1500
5. **Add Variant**:
   - Color: "Black"
   - Size: "52""
   - Stock: 10
6. **Click "Add Product Variants"**

## Advanced: Multiple Variants

Click "+ Add Variant" to create multiple color/size combinations in one product entry:
- Variant 1: Black, 52", Stock 10
- Variant 2: Black, 54", Stock 15
- Variant 3: Navy Blue, 52", Stock 12

All will be saved together with the click of one button!

---

**Last Updated**: 2026-02-19
**Product Form**: Inventory Management → "Add New Product with Multiple Variants"
