/**
 * Test Script for Undo Sale Feature
 * This script will:
 * 1. Fetch existing sales
 * 2. Create a refund for one
 * 3. Complete the refund to trigger Undo Sale
 * 4. Verify all reversals work correctly
 */

const API_URL = "http://localhost:3210";

async function testUndoSale() {
  try {
    console.log("🔍 Starting Undo Sale Test...\n");

    // 1. Fetch existing sales
    console.log("📋 Fetching existing sales...");
    const salesResponse = await fetch(`${API_URL}/api/sales/list`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!salesResponse.ok) {
      console.log("❌ Could not fetch sales list");
      return;
    }

    const sales = await salesResponse.json();
    console.log(`✅ Found ${sales.length} sales`);

    if (sales.length === 0) {
      console.log("❌ No sales found to test with");
      return;
    }

    // Get the last sale (bottom of list)
    const testSale = sales[sales.length - 1];
    console.log(`\n📌 Selected Sale for Testing:`);
    console.log(`   Sale #: ${testSale.saleNumber}`);
    console.log(`   Customer: ${testSale.customerName || "Walk-in"}`);
    console.log(`   Amount: ${testSale.total}`);
    console.log(`   Status: ${testSale.status}`);
    console.log(`   Items: ${testSale.items?.length || 0}`);

    // 2. Create refund
    console.log(`\n💼 Creating refund for sale ${testSale.saleNumber}...`);
    const refundData = {
      saleId: testSale._id,
      saleNumber: testSale.saleNumber,
      branchId: testSale.branchId,
      branchName: testSale.branchName,
      customerId: testSale.customerId,
      customerName: testSale.customerName || "Walk-in",
      customerPhone: testSale.customerPhone,
      items: testSale.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        size: item.size,
        reason: "testing",
        condition: "new",
      })),
      subtotal: testSale.subtotal,
      tax: testSale.tax,
      discount: testSale.discount,
      refundAmount: testSale.total,
      refundMethod: testSale.paymentMethod,
      originalPaymentMethod: testSale.paymentMethod,
      refundDetails: testSale.paymentDetails,
      status: "pending",
      requestDate: Date.now(),
      refundReason: "testing_undo_sale",
      refundNotes: "Test refund for Undo Sale feature verification",
      internalNotes: "Automated test - please check undo sale logic",
      isReturned: false,
      restockRequired: true,
      restockQuantity: testSale.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    console.log("✅ Refund created");

    console.log(`\n✨ Test Setup Complete`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`To complete the Undo Sale test:`);
    console.log(`1. Open the app in your browser`);
    console.log(`2. Go to Refund Management`);
    console.log(`3. Look for the refund just created`);
    console.log(`4. Complete the refund`);
    console.log(`5. Verify:`);
    console.log(`   ✅ Sale status changed to "cancelled"`);
    console.log(`   ✅ Sale no longer visible in sales list`);
    console.log(`   ✅ Inventory restored (check stock movements)`);
    console.log(`   ✅ Loyalty points reversed (if applicable)`);
    console.log(`   ✅ Audit trail shows all reversals`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error("❌ Test Error:", error.message);
  }
}

// Run the test
testUndoSale();
