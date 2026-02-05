import { useState, useRef, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Sale {
  _id: Id<"sales">;
  saleNumber: string;
  customerName?: string;
  items: Array<{
    productId: Id<"products">;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    size?: string;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentDetails?: {
    transactionId?: string;
    phoneNumber?: string;
    reference?: string;
  };
  _creationTime: number;
}

interface InvoiceModalProps {
  sale: Sale;
  onClose: () => void;
}

interface PrintSettings {
  paperSize: '58mm' | '80mm' | 'A4';
  fontSize: 'small' | 'medium' | 'large';
  includeLogo: boolean;
  includeBarcode: boolean;
  includeQR: boolean;
  copies: number;
  autoOpenCashDrawer: boolean;
  colorPrint: boolean;
}

export function InvoiceModal({ sale, onClose }: InvoiceModalProps) {
  const storeSettings = useQuery(api.settings.get);
  
  const [shopSettings, setShopSettings] = useState({
    name: "DUBAI BORKA HOUSE",
    address: "Shop-342, Label-4, Meridian Kohinur City, GEC, Chittagong.",
    phone1: "+880-1845-853634",
    phone2: "+880-1977-403060",
    email: "info@dubaiborkahouse.com",
    website: "www.dubaiborkahouse.com",
    vatNumber: "VAT: 123456789",
    trn: "TRN: 100123456789003",
    logo: ""
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    paperSize: '80mm',
    fontSize: 'medium',
    includeLogo: true,
    includeBarcode: true,
    includeQR: true,
    copies: 1,
    autoOpenCashDrawer: false,
    colorPrint: false
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>("");
  const invoiceRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-save settings to localStorage
  useEffect(() => {
    const savedShopSettings = localStorage.getItem('shopSettings');
    const savedPrintSettings = localStorage.getItem('printSettings');
    
    if (savedShopSettings) {
      setShopSettings(JSON.parse(savedShopSettings));
    }
    if (savedPrintSettings) {
      setPrintSettings(JSON.parse(savedPrintSettings));
    }

    // Load logo from store settings
    if (storeSettings?.logo) {
      setShopSettings(prev => ({
        ...prev,
        logo: storeSettings?.logo || prev.logo
      }));
    }
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('shopSettings', JSON.stringify(shopSettings));
  }, [shopSettings]);

  useEffect(() => {
    localStorage.setItem('printSettings', JSON.stringify(printSettings));
  }, [printSettings]);

  // Generate QR Code
  useEffect(() => {
    if (printSettings.includeQR) {
      // QR code contains only Facebook link
      const qrData = "https://www.facebook.com/AbayaStoreDubai";

      QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then((url: string) => {
        setQrCodeDataUrl(url);
      }).catch((err: Error) => {
        console.error('QR Code generation error:', err);
      });
    }
  }, [printSettings.includeQR, sale, shopSettings]);

  // Generate Barcode
  useEffect(() => {
    if (printSettings.includeBarcode && barcodeCanvasRef.current) {
      try {
        // Generate barcode with website URL
        const barcodeData = "https://dubaiborkahouse.com";
        JsBarcode(barcodeCanvasRef.current, barcodeData, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          textMargin: 2
        });
        
        const dataUrl = barcodeCanvasRef.current.toDataURL();
        setBarcodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [printSettings.includeBarcode, sale.saleNumber]);

  const getPrintStyles = () => {
    const baseStyles = `
      @media print {
        @page { 
          size: ${printSettings.paperSize === 'A4' ? 'A4' : `${printSettings.paperSize} auto`}; 
          margin: ${printSettings.paperSize === 'A4' ? '10mm' : '2mm'}; 
        }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: ${printSettings.fontSize === 'small' ? '9px' : printSettings.fontSize === 'large' ? '13px' : '11px'}; 
          line-height: 1.3;
          margin: 0;
          padding: ${printSettings.paperSize === 'A4' ? '5mm' : '2mm'};
          color: ${printSettings.colorPrint ? '#000' : '#000'};
          width: ${printSettings.paperSize === '58mm' ? '58mm' : printSettings.paperSize === '80mm' ? '80mm' : '100%'};
        }
        .no-print { display: none !important; }
        .invoice-container {
          width: 100%;
          max-width: ${printSettings.paperSize === 'A4' ? '100%' : '100%'};
        }
        .invoice-header { 
          text-align: center; 
          margin-bottom: 8px; 
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
        }
        .shop-name {
          font-size: ${printSettings.fontSize === 'small' ? '12px' : printSettings.fontSize === 'large' ? '16px' : '14px'};
          font-weight: bold;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .shop-details {
          font-size: ${printSettings.fontSize === 'small' ? '8px' : printSettings.fontSize === 'large' ? '11px' : '9px'};
          line-height: 1.2;
        }
        .invoice-details { 
          margin-bottom: 8px; 
          font-size: ${printSettings.fontSize === 'small' ? '9px' : printSettings.fontSize === 'large' ? '12px' : '10px'};
        }
        .invoice-items { 
          margin-bottom: 8px; 
        }
        .item-row {
          margin-bottom: 1px;
          font-size: ${printSettings.fontSize === 'small' ? '9px' : printSettings.fontSize === 'large' ? '12px' : '10px'};
          page-break-inside: avoid;
        }
        .invoice-total { 
          margin-bottom: 8px; 
          border-top: 2px solid #000;
          padding-top: 5px;
        }
        .invoice-footer { 
          text-align: center; 
          margin-top: 8px; 
          border-top: 1px dashed #000;
          padding-top: 5px;
          font-size: ${printSettings.fontSize === 'small' ? '8px' : printSettings.fontSize === 'large' ? '11px' : '9px'};
        }
        .divider { 
          border-top: 1px dashed #000; 
          margin: 2px 0; 
        }
        .solid-divider {
          border-top: 1px solid #000;
          margin: 5px 0;
        }
        .double-divider {
          border-top: 3px double #000;
          margin: 5px 0;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .qr-code, .barcode {
          text-align: center;
          margin: 10px 0;
        }
        .qr-code img, .barcode img {
          max-width: 100px;
          height: auto;
        }
        .logo-placeholder {
          width: 60px;
          height: 60px;
          border: 2px solid #000;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          background: ${printSettings.colorPrint ? '#f0f0f0' : 'white'};
        }
        .highlight {
          background: ${printSettings.colorPrint ? '#ffff99' : 'transparent'};
          padding: 2px;
        }
        .total-highlight {
          background: ${printSettings.colorPrint ? '#e6ffe6' : 'transparent'};
          padding: 3px;
          border: 2px solid #000;
        }
      }
      @media screen {
        body {
          font-family: 'Courier New', monospace;
          max-width: ${printSettings.paperSize === 'A4' ? '210mm' : printSettings.paperSize === '80mm' ? '80mm' : '58mm'};
          margin: 0 auto;
          padding: 10px;
          background: white;
        }
        .invoice-container {
          border: 1px solid #ddd;
          padding: 10px;
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      }
    `;
    return baseStyles;
  };

  const handlePrint = async () => {
    if (isPrinting) {
      toast.warning("Print job already in progress...");
      return;
    }

    setIsPrinting(true);
    toast.info("🖨️ Preparing receipt for printing...");

    try {
      const printContent = invoiceRef.current;
      if (!printContent) {
        throw new Error("Invoice content not found");
      }

      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error("Unable to open print window. Please check popup settings.");
      }

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${sale.saleNumber}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${getPrintStyles()}
            </style>
          </head>
          <body>
            <div class="invoice-container">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  ${printSettings.autoOpenCashDrawer ? `
                    // ESC/POS command to open cash drawer
                    const escPos = String.fromCharCode(27) + String.fromCharCode(112) + String.fromCharCode(0) + String.fromCharCode(25) + String.fromCharCode(250);
                    console.log('Opening cash drawer...');
                  ` : ''}
                }, 500);
              };
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();

      // Print multiple copies if specified
      if (printSettings.copies > 1) {
        for (let i = 1; i < printSettings.copies; i++) {
          setTimeout(() => {
            const copyWindow = window.open('', '_blank', 'width=800,height=600');
            if (copyWindow) {
              copyWindow.document.write(invoiceHTML);
              copyWindow.document.close();
            }
          }, i * 1000);
        }
        toast.success(`🖨️ Printing ${printSettings.copies} copies...`);
      } else {
        toast.success("🖨️ Receipt sent to printer!");
      }

      // Auto-close modal after successful print
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error("Print error:", error);
      toast.error(`❌ Print failed: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSavePDF = async () => {
    if (!invoiceRef.current) return;

    toast.info("📄 Generating PDF...");
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: printSettings.paperSize === 'A4' ? 'a4' : [80, canvas.height * 0.264583]
      });

      const imgWidth = printSettings.paperSize === 'A4' ? 210 : 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt-${sale.saleNumber}.pdf`);
      
      toast.success("📄 PDF saved successfully!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("❌ Failed to generate PDF");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Receipt ${sale.saleNumber}`,
      text: `Receipt from ${shopSettings.name}\nCustomer: ${sale.customerName || 'Walk-in Customer'}\nTotal: ৳${sale.total.toLocaleString('en-BD')}\nDate: ${new Date(sale._creationTime).toLocaleDateString('en-BD')}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("📤 Receipt shared successfully!");
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const receiptText = `Receipt ${sale.saleNumber}\n${shopSettings.name}\nCustomer: ${sale.customerName || 'Walk-in Customer'}\nTotal: ৳${sale.total.toLocaleString('en-BD')}\nDate: ${new Date(sale._creationTime).toLocaleDateString('en-BD')}\nPayment: ${sale.paymentMethod.toUpperCase()}`;
    
    navigator.clipboard.writeText(receiptText).then(() => {
      toast.success("📋 Receipt details copied to clipboard!");
    }).catch(() => {
      toast.error("❌ Unable to copy receipt details");
    });
  };

  const handleEmailReceipt = () => {
    const subject = `Receipt ${sale.saleNumber} - ${shopSettings.name}`;
    const body = `Dear ${sale.customerName || 'Valued Customer'},\n\nThank you for your purchase!\n\nReceipt Details:\nInvoice: ${sale.saleNumber}\nDate: ${new Date(sale._creationTime).toLocaleDateString('en-BD')}\nTotal: ৳${sale.total.toLocaleString('en-BD')}\nPayment: ${sale.paymentMethod.toUpperCase()}\n\nItems:\n${sale.items.map(item => `- ${item.productName} (${item.quantity}x) - ৳${item.totalPrice.toLocaleString('en-BD')}`).join('\n')}\n\nThank you for shopping with us!\n\nBest regards,\n${shopSettings.name}`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    toast.info("📧 Email client opened with receipt details");
  };

  const handleWhatsAppShare = () => {
    const message = `*Receipt ${sale.saleNumber}*\n\n*${shopSettings.name}*\n${shopSettings.address}\n\nCustomer: ${sale.customerName || 'Walk-in Customer'}\nDate: ${new Date(sale._creationTime).toLocaleDateString('en-BD')}\nTime: ${new Date(sale._creationTime).toLocaleTimeString('en-BD')}\n\n*Items:*\n${sale.items.map(item => `• ${item.productName}\n  ${item.quantity} × ৳${item.unitPrice.toLocaleString('en-BD')} = ৳${item.totalPrice.toLocaleString('en-BD')}`).join('\n\n')}\n\n*Total: ৳${sale.total.toLocaleString('en-BD')}*\nPayment: ${sale.paymentMethod.toUpperCase()}\n\nThank you for shopping with us! 🛍️`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("📱 WhatsApp opened with receipt details");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto">
        <div className="flex">
          {/* Invoice Preview */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📄 Receipt Preview</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Paper: {printSettings.paperSize}</span>
                <span>•</span>
                <span>Font: {printSettings.fontSize}</span>
                <span>•</span>
                <span>Copies: {printSettings.copies}</span>
              </div>
            </div>

            {/* Invoice Content */}
            <div 
              ref={invoiceRef}
              className={`font-mono text-sm border-2 border-gray-300 p-4 bg-white shadow-lg ${
                printSettings.paperSize === '58mm' ? 'max-w-[58mm]' : 
                printSettings.paperSize === '80mm' ? 'max-w-[80mm]' : 'max-w-full'
              } mx-auto`}
              style={{ 
                fontSize: printSettings.fontSize === 'small' ? '11px' : printSettings.fontSize === 'large' ? '15px' : '13px',
                width: printSettings.paperSize === '58mm' ? '220px' : printSettings.paperSize === '80mm' ? '300px' : '100%'
              }}
            >
              {/* Header */}
              <div className="invoice-header text-center mb-4">
                {printSettings.includeLogo && shopSettings.logo && (
                  <div className="text-center mx-auto mb-3">
                    <img 
                      src={shopSettings.logo} 
                      alt="Logo" 
                      style={{ 
                        maxWidth: '80px',
                        maxHeight: '80px',
                        margin: '0 auto 8px'
                      }}
                    />
                  </div>
                )}
                <div className="shop-name text-lg font-bold uppercase">{shopSettings.name}</div>
                <div className="shop-details">
                  <p className="text-xs">{shopSettings.address}</p>
                  <p className="text-xs">📞 {shopSettings.phone1}</p>
                  {shopSettings.phone2 && <p className="text-xs">📞 {shopSettings.phone2}</p>}
                  <p className="text-xs">📧 {shopSettings.email}</p>
                  <p className="text-xs">{shopSettings.website}</p>
                  {shopSettings.vatNumber && <p className="text-xs font-bold">{shopSettings.vatNumber}</p>}
                  {shopSettings.trn && <p className="text-xs font-bold">{shopSettings.trn}</p>}
                </div>
              </div>

              <div className="double-divider"></div>

              {/* Invoice Details */}
              <div className="invoice-details mb-4">
                <div className="flex-between highlight">
                  <span className="font-bold">RECEIPT: {sale.saleNumber}</span>
                </div>
                <div className="flex-between">
                  <span>📅 {new Date(sale._creationTime).toLocaleDateString('en-BD')}</span>
                  <span>🕐 {new Date(sale._creationTime).toLocaleTimeString('en-BD', { hour12: true })}</span>
                </div>
                <div>👤 Customer: {sale.customerName || 'Walk-in Customer'}</div>
                <div>👨‍💼 Cashier: Admin</div>
                <div>💳 Payment: {sale.paymentMethod.toUpperCase()}</div>
                {sale.paymentDetails?.transactionId && (
                  <div>🔢 Txn ID: {sale.paymentDetails.transactionId}</div>
                )}
                {sale.paymentDetails?.phoneNumber && (
                  <div>📱 Phone: {sale.paymentDetails.phoneNumber}</div>
                )}
              </div>

              <div className="solid-divider"></div>

              {/* Items */}
              <div className="invoice-items mb-4">
                <div className="font-bold mb-2 text-center uppercase">Items Purchased</div>
                {sale.items.map((item, index) => (
                  <div key={index} className="item-row mb-1">
                    <div className="font-bold">{item.productName}</div>
                    <div className="flex-between">
                      <span>{item.quantity} × ৳{item.unitPrice.toLocaleString('en-BD')}</span>
                      <span className="font-bold">৳{item.totalPrice.toLocaleString('en-BD')}</span>
                    </div>
                    {item.size && <div className="text-xs">📏 Size: {item.size}</div>}
                    <div className="divider"></div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="invoice-total mb-4">
                <div className="flex-between">
                  <span>Subtotal:</span>
                  <span>৳{sale.subtotal.toLocaleString('en-BD')}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex-between">
                    <span>Discount:</span>
                    <span className="text-red-600">-৳{sale.discount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="double-divider"></div>
                <div className="flex-between font-bold text-lg total-highlight">
                  <span>TOTAL:</span>
                  <span>৳{sale.total.toLocaleString('en-BD')}</span>
                </div>
                <div className="flex-between">
                  <span>Paid:</span>
                  <span>৳{sale.paidAmount.toLocaleString('en-BD')}</span>
                </div>
                {sale.dueAmount > 0 ? (
                  <div className="flex-between font-bold text-red-600">
                    <span>Due:</span>
                    <span>৳{sale.dueAmount.toLocaleString('en-BD')}</span>
                  </div>
                ) : sale.paidAmount > sale.total && (
                  <div className="flex-between font-bold text-green-600">
                    <span>Change:</span>
                    <span>৳{(sale.paidAmount - sale.total).toLocaleString('en-BD')}</span>
                  </div>
                )}
              </div>

              {printSettings.includeBarcode && barcodeDataUrl && (
                <div className="barcode text-center mb-4">
                  <div className="text-xs font-bold mb-2">🌐 Visit Us Online 🌐</div>
                  <img src={barcodeDataUrl} alt="Barcode" style={{ maxWidth: '100%', height: 'auto' }} />
                  <div className="text-xs mt-2 font-bold">www.dubaiborkahouse.com</div>
                </div>
              )}

              {printSettings.includeQR && qrCodeDataUrl && (
                <div className="qr-code text-center my-6">
                  <p className="text-xs font-bold mb-2">👉 Follow Us 👈</p>
                  <img src={qrCodeDataUrl} alt="QR Code" style={{ width: '100px', height: '100px', margin: '0 auto' }} />
                  <div className="text-xs mt-2 font-bold">Facebook</div>
                </div>
              )}

              <div className="divider"></div>

              {/* Footer */}
              <div className="invoice-footer text-center">
                <p className="font-bold mb-2">🌟 TERMS & CONDITIONS 🌟</p>
                <p className="text-xs mb-1">• Replace within 3 days with receipt</p>
                <div className="divider"></div>
                <p className="font-bold text-lg mb-2">Thank You for Shopping!</p>
                <p className="font-bold mb-2">جزاك الله خيرا</p>
                <p className="text-xs">{shopSettings.website}</p>
              </div>
            </div>

            {/* Hidden canvases for barcode generation */}
            <canvas ref={qrCanvasRef} style={{ display: 'none' }} />
            <canvas ref={barcodeCanvasRef} style={{ display: 'none' }} />
          </div>

          {/* Settings Panel */}
          <div className="w-80 border-l border-gray-200 bg-gray-50">
            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">🚀 Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {isPrinting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Printing...
                    </>
                  ) : (
                    <>🖨️ Print Receipt</>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSavePDF}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    📄 Save PDF
                  </button>
                  <button
                    onClick={handleEmailReceipt}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                  >
                    📧 Email
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
                  >
                    📱 WhatsApp
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>

            {/* Print Settings */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">⚙️ Print Settings</h4>
                <button
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isCustomizing ? 'Hide' : 'Customize'}
                </button>
              </div>
              
              {isCustomizing && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                    <select
                      value={printSettings.paperSize}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, paperSize: e.target.value as any }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="58mm">58mm (Small Receipt)</option>
                      <option value="80mm">80mm (Standard Receipt)</option>
                      <option value="A4">A4 (Full Page)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                    <select
                      value={printSettings.fontSize}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, fontSize: e.target.value as any }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="small">Small (9px)</option>
                      <option value="medium">Medium (11px)</option>
                      <option value="large">Large (13px)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Copies</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={printSettings.copies}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printSettings.includeLogo}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, includeLogo: e.target.checked }))}
                        className="mr-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Include Logo Placeholder</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printSettings.includeBarcode}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, includeBarcode: e.target.checked }))}
                        className="mr-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Include Barcode</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printSettings.includeQR}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, includeQR: e.target.checked }))}
                        className="mr-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Include QR Code</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printSettings.colorPrint}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, colorPrint: e.target.checked }))}
                        className="mr-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Color Highlights</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={printSettings.autoOpenCashDrawer}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, autoOpenCashDrawer: e.target.checked }))}
                        className="mr-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Auto Open Cash Drawer</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Shop Settings */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">🏪 Shop Information</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Shop Name"
                  value={shopSettings.name}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={shopSettings.address}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Phone 1"
                    value={shopSettings.phone1}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, phone1: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone 2"
                    value={shopSettings.phone2}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, phone2: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={shopSettings.email}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Website"
                  value={shopSettings.website}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="VAT Number"
                  value={shopSettings.vatNumber}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, vatNumber: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="TRN Number"
                  value={shopSettings.trn}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, trn: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
