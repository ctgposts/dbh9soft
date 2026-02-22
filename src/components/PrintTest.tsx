import { useState } from "react";
import { toast } from "sonner";

export function PrintTest() {
  const [testReceipt, setTestReceipt] = useState({
    saleNumber: "TEST-001",
    customerName: "Test Customer",
    items: [
      {
        productName: "Elegant Black Abaya",
        quantity: 1,
        unitPrice: 2500,
        totalPrice: 2500,
        size: '54"'
      },
      {
        productName: "Premium Hijab Set",
        quantity: 2,
        unitPrice: 800,
        totalPrice: 1600,
        size: undefined
      }
    ],
    subtotal: 4100,
    discount: 100,
    total: 4000,
    paidAmount: 4000,
    dueAmount: 0,
    paymentMethod: "cash",
    _creationTime: Date.now()
  });

  const handleTestPrint = () => {
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Test - ${testReceipt.saleNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 2mm; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 11px; 
                line-height: 1.3;
                margin: 0;
                padding: 2mm;
                color: #000;
              }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
              .shop-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
              .divider { border-top: 1px dashed #000; margin: 5px 0; }
              .flex-between { display: flex; justify-content: space-between; }
              .font-bold { font-weight: bold; }
              .text-center { text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">DUBAI BORKA HOUSE</div>
            <div style="font-size: 9px;">Dubai Fashion District, UAE</div>
            <div style="font-size: 9px;">Phone: +971-XX-XXXXXXX</div>
          </div>
          
          <div class="divider"></div>
          
          <div style="margin-bottom: 10px;">
            <div class="flex-between"><span>Receipt: ${testReceipt.saleNumber}</span></div>
            <div class="flex-between">
              <span>Date: ${new Date(testReceipt._creationTime).toLocaleDateString('en-BD')}</span>
              <span>Time: ${new Date(testReceipt._creationTime).toLocaleTimeString('en-BD')}</span>
            </div>
            <div>Customer: ${testReceipt.customerName}</div>
            <div>Payment: ${testReceipt.paymentMethod.toUpperCase()}</div>
          </div>
          
          <div class="divider"></div>
          
          <div style="margin-bottom: 10px;">
            <div class="font-bold text-center">ITEMS PURCHASED</div>
            ${testReceipt.items.map(item => `
              <div style="margin-bottom: 3px;">
                <div class="font-bold">${item.productName}</div>
                <div class="flex-between">
                  <span>${item.quantity} × ৳${item.unitPrice.toLocaleString('en-BD')}</span>
                  <span class="font-bold">৳${item.totalPrice.toLocaleString('en-BD')}</span>
                </div>
                ${item.size ? `<div style="font-size: 9px;">Size: ${item.size}</div>` : ''}
                <div class="divider"></div>
              </div>
            `).join('')}
          </div>
          
          <div style="border-top: 2px solid #000; padding-top: 5px; margin-bottom: 10px;">
            <div class="flex-between"><span>Subtotal:</span><span>৳${testReceipt.subtotal.toLocaleString('en-BD')}</span></div>
            ${testReceipt.discount > 0 ? `<div class="flex-between"><span>Discount:</span><span>-৳${testReceipt.discount.toLocaleString('en-BD')}</span></div>` : ''}
            <div class="flex-between font-bold" style="font-size: 14px; border: 1px solid #000; padding: 3px;">
              <span>TOTAL:</span><span>৳${testReceipt.total.toLocaleString('en-BD')}</span>
            </div>
            <div class="flex-between"><span>Paid:</span><span>৳${testReceipt.paidAmount.toLocaleString('en-BD')}</span></div>
          </div>
          
          <div class="divider"></div>
          
          <div class="text-center" style="font-size: 9px;">
            <div class="font-bold">Thank You for Shopping!</div>
            <div class="font-bold">جزاك الله خيرا</div>
            <div>www.raisadubai.com</div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(testHTML);
      printWindow.document.close();
      toast.success("🖨️ Test receipt sent to printer!");
    } else {
      toast.error("❌ Unable to open print window. Please check popup settings.");
    }
  };

  const handleTestThermalPrint = () => {
    const thermalHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Print Test</title>
          <style>
            @media print {
              @page { size: 58mm auto; margin: 1mm; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 9px; 
                line-height: 1.2;
                margin: 0;
                padding: 1mm;
                color: #000;
                width: 58mm;
              }
              .header { text-align: center; margin-bottom: 5px; }
              .shop-name { font-size: 11px; font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 3px 0; }
              .flex-between { display: flex; justify-content: space-between; }
              .font-bold { font-weight: bold; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">DUBAI BORKA HOUSE</div>
            <div style="font-size: 7px;">Dubai, UAE</div>
          </div>
          <div class="divider"></div>
          <div style="font-size: 8px;">
            <div>Receipt: ${testReceipt.saleNumber}</div>
            <div>${new Date().toLocaleDateString('en-BD')}</div>
            <div>Customer: Test</div>
          </div>
          <div class="divider"></div>
          <div style="font-size: 8px;">
            <div>Test Item</div>
            <div class="flex-between">
              <span>1 × ৳100</span>
              <span>৳100</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex-between font-bold">
            <span>TOTAL:</span>
            <span>৳100</span>
          </div>
          <div class="divider"></div>
          <div style="text-align: center; font-size: 7px;">
            <div>Thank You!</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(thermalHTML);
      printWindow.document.close();
      toast.success("🖨️ Thermal test receipt sent to printer!");
    } else {
      toast.error("❌ Unable to open print window.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🖨️ Print System Test</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Test Receipt Data</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Receipt: {testReceipt.saleNumber}</div>
            <div>Customer: {testReceipt.customerName}</div>
            <div>Items: {testReceipt.items.length}</div>
            <div>Total: ৳{testReceipt.total.toLocaleString('en-BD')}</div>
            <div>Payment: {testReceipt.paymentMethod.toUpperCase()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleTestPrint}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            🖨️ Test Standard Print (80mm)
          </button>
          
          <button
            onClick={handleTestThermalPrint}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            🖨️ Test Thermal Print (58mm)
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 Print Test Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure your printer is connected and ready</li>
            <li>• Allow popups for this website</li>
            <li>• Select the correct printer in the print dialog</li>
            <li>• For thermal printers, choose the appropriate paper size</li>
            <li>• Test both standard and thermal formats</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">⚠️ Troubleshooting</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• If print dialog doesn't open, check popup blocker</li>
            <li>• For thermal printers, ensure correct paper size is selected</li>
            <li>• If text is cut off, adjust margins in print settings</li>
            <li>• For best results, use "More settings" → "Options" → "Headers and footers" → None</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
