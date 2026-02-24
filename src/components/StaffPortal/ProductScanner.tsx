import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, Flashlight, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const ProductScanner: React.FC<ProductScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);

  useEffect(() => {
    if (!useManualInput && isScanning) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [useManualInput, isScanning]);

  const initializeScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-scanner-container',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // সফল স্ক্যান
        setIsScanning(false);
        toast.success(`বারকোড স্ক্যান হয়েছে: ${decodedText}`);
        setTimeout(() => {
          onScan(decodedText);
        }, 500);
      },
      (error) => {
        // ত্রুটি উপেক্ষা করুন (এটি স্বাভাবিক)
      }
    );

    // ফ্ল্যাশ সাপোর্ট চেক করুন
    (Html5QrcodeScanner as any)
      .getCameras?.()
      .then(() => {
        setHasFlash(true);
      })
      .catch(() => {
        setHasFlash(false);
      });
  };

  const toggleFlash = async () => {
    if (scannerRef.current && hasFlash) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          if (flashEnabled) {
            await (scannerRef.current as any).applyVideoConstraints({
              advanced: [{ torch: false }],
            });
          } else {
            await (scannerRef.current as any).applyVideoConstraints({
              advanced: [{ torch: true }],
            });
          }
          setFlashEnabled(!flashEnabled);
          toast.success(flashEnabled ? 'ফ্ল্যাশ বন্ধ' : 'ফ্ল্যাশ চালু');
        }
      } catch (error) {
        toast.error('ফ্ল্যাশ নিয়ন্ত্রণে সমস্যা');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      toast.success(`ম্যানুয়াল ইনপুট: ${manualBarcode}`);
      onScan(manualBarcode);
      setManualBarcode('');
    } else {
      toast.error('বারকোড খালি');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 shadow-2xl overflow-hidden">
        {/* হেডার */}
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h2 className="text-lg font-bold">বারকোড স্ক্যানার</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-purple-700 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* স্ক্যানার বা ম্যানুয়াল ইনপুট */}
        <div className="p-4">
          {!useManualInput ? (
            <div className="mb-4">
              {/* স্ক্যানার কন্টেইনার */}
              <div id="qr-scanner-container" className="rounded-lg overflow-hidden mb-4" />

              {/* নিয়ন্ত্রণ বাটন */}
              <div className="flex gap-2 mb-4">
                {hasFlash && (
                  <button
                    onClick={toggleFlash}
                    className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                      flashEnabled
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    <Flashlight className="w-4 h-4" />
                    ফ্ল্যাশ
                  </button>
                )}
                <button
                  onClick={() => setUseManualInput(true)}
                  className="flex-1 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600 transition"
                >
                  ম্যানুয়াল ইনপুট
                </button>
              </div>

              {/* নির্দেশনা */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-semibold mb-2">📸 নির্দেশনা:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>বারকোডটি ক্যামেরার সামনে রাখুন</li>
                  <li>স্বয়ংক্রিয় স্ক্যান হবে</li>
                  <li>স্পষ্ট এবং ভালো আলো নিশ্চিত করুন</li>
                </ul>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  বারকোড ম্যানুয়ালি লিখুন
                </label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value.toUpperCase())}
                  placeholder="উদা: DBH-0045 অথবা ABC1234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  সাবমিট করুন
                </button>
                <button
                  type="button"
                  onClick={() => setUseManualInput(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  স্ক্যানার
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p>বারকোড সঠিকভাবে লিখুন এবং সাবমিট বাটনে ক্লিক করুন</p>
              </div>
            </form>
          )}
        </div>

        {/* ফুটার */}
        <div className="bg-gray-100 p-3 border-t border-gray-200 text-sm text-gray-600 text-center">
          ⚡ স্ক্যানিং স্ট্যাটাস: {isScanning ? '🟢 সক্রিয়' : '🟡 প্রস্তুত'}
        </div>
      </div>
    </div>
  );
};
