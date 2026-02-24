import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onBarcodeDetected }: BarcodeScannerProps) {
  const scannerRef = useRef<HTML5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    try {
      setError(null);
      setIsScanning(true);

      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "barcode-scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            videoConstraints: {
              facingMode: { ideal: "environment" } // Use rear camera on mobile
            }
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            // Barcode/QR code detected
            onBarcodeDetected(decodedText);
            toast.success(`🎉 Barcode scanned: ${decodedText}`);
            
            // Pause scanner after detection
            try {
              scanner.pause();
            } catch (e) {
              console.error('Error pausing scanner:', e);
            }
          },
          (error) => {
            // Error during scanning - ignore these as they're normal
            // (No barcode detected yet)
          }
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize scanner';
      console.error('Scanner error:', err);
      setError(errorMessage);
      toast.error(`❌ Scanner Error: ${errorMessage}`);
      setIsScanning(false);
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.pause();
          }
        } catch (e) {
          console.error('Error stopping scanner:', e);
        }
      }
    };
  }, [isOpen, onBarcodeDetected]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.pause();
        }
        // Don't call stop() as it causes issues, just pause
      } catch (e) {
        console.error('Error closing scanner:', e);
      }
    }
    setIsScanning(false);
    onClose();
  };

  const handleResume = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
        setIsScanning(true);
      } catch (e) {
        console.error('Error resuming scanner:', e);
        setError('Failed to resume scanner');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📱 Barcode Scanner
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scanner Container */}
        <div className="p-4 space-y-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 text-sm mb-4">
                <strong>❌ Camera Error:</strong> {error}
              </p>
              <div className="space-y-2">
                <p className="text-xs text-red-700">
                  Make sure:
                </p>
                <ul className="text-xs text-red-700 text-left space-y-1 list-disc list-inside">
                  <li>Camera permission is granted</li>
                  <li>Browser supports Camera API</li>
                  <li>Using HTTPS or localhost</li>
                  <li>No other app using camera</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                🔄 Retry
              </button>
            </div>
          ) : (
            <>
              {/* Scanner Feed */}
              <div className="bg-black rounded-lg overflow-hidden border-4 border-blue-400">
                <div id="barcode-scanner-container" className="w-full" style={{ minHeight: '300px' }} />
              </div>

              {/* Status */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-800">
                  {isScanning ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-pulse inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                      <strong>🎯 Scanner Active - Point at barcode</strong>
                    </span>
                  ) : (
                    <>
                      <strong>⏸️ Scanner Paused</strong>
                    </>
                  )}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 rounded-lg p-3 space-y-2 text-xs text-amber-800">
                <p className="font-semibold">📸 Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Position barcode in the center square</li>
                  <li>Keep camera steady and well-lit</li>
                  <li>Barcode will auto-detect when recognized</li>
                  <li>Use torch button if lighting is poor</li>
                </ul>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-2">
                {!isScanning && (
                  <button
                    onClick={handleResume}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    ▶️ Resume
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm transition-colors ${
                    !isScanning ? '' : 'col-span-2'
                  }`}
                >
                  ✕ Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
