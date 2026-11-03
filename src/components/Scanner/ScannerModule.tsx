import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Sample, SystemSettings, UserProfile } from '../../types';
import { playScanSuccessSound, playScanErrorSound } from '../../services/barcodeService';
import { updateSampleStatus } from '../../services/dbService';
import { PrintLabelModal } from './PrintLabelModal';
import {
  Camera,
  Barcode,
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  Clock,
  Sparkles,
  Volume2,
  Keyboard,
  ExternalLink,
} from 'lucide-react';

interface ScannerModuleProps {
  samples: Sample[];
  currentUser: UserProfile;
  settings: SystemSettings;
  onOpenSampleDetail?: (sample: Sample) => void;
}

type ScanMode = 'LOOKUP' | 'PICKUP' | 'DISPATCH' | 'RECEIVE';

interface ScanHistoryItem {
  id: string;
  sampleId: string;
  barcode: string;
  patientName: string;
  testName: string;
  actionTaken: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export const ScannerModule: React.FC<ScannerModuleProps> = ({
  samples,
  currentUser,
  settings,
  onOpenSampleDetail,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('LOOKUP');
  const [manualCode, setManualCode] = useState('');
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeScannedSample, setActiveScannedSample] = useState<Sample | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [printSample, setPrintSample] = useState<Sample | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScannedTime, setLastScannedTime] = useState<number>(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const html5QrRegionId = 'qr-reader-interactive';

  // Bluetooth / USB Barcode Scanner Keyboard Wedge listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const currentTime = Date.now();
      // Hardware scanners send characters rapidly (< 50ms interval)
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          processScannedCode(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [samples, scanMode, currentUser]);

  // Start / Stop Camera Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore if not running
        }
      }

      const html5QrCode = new Html5Qrcode(html5QrRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.6,
        },
        (decodedText) => {
          processScannedCode(decodedText);
        },
        () => {
          // Frame error (silently ignore unrecognised frames)
        }
      );
      setIsScanningCamera(true);
    } catch (err: unknown) {
      console.error('Camera Scanner start failed:', err);
      setCameraError(
        'Camera permission denied or camera device unavailable. You can still use the USB/Bluetooth scanner or enter barcode manually.'
      );
      setIsScanningCamera(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Silent clean up
      }
      scannerRef.current = null;
    }
    setIsScanningCamera(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {
          // Cleanup
        }
      }
    };
  }, []);

  // Process Scanned Code (Works for Camera, Bluetooth, USB, and Manual)
  const processScannedCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    // Duplicate prevention: If scanned within 3 seconds, ignore or warn
    if (code === lastScannedCode && now - lastScannedTime < 3000) {
      playScanErrorSound();
      return;
    }

    setLastScannedCode(code);
    setLastScannedTime(now);

    // Look for matching sample by Barcode, QR Code, Sample ID, or Patient ID
    const matched = samples.find(
      (s) =>
        s.barcodeNumber.toLowerCase() === code.toLowerCase() ||
        s.sampleId.toLowerCase() === code.toLowerCase() ||
        s.qrCode.toLowerCase() === code.toLowerCase() ||
        s.id.toLowerCase() === code.toLowerCase()
    );

    if (!matched) {
      playScanErrorSound();
      setScanHistory((prev) => [
        {
          id: `hist-${Date.now()}`,
          sampleId: 'UNKNOWN',
          barcode: code,
          patientName: 'Unregistered',
          testName: 'No matching sample found',
          actionTaken: 'Scan Rejected: Not in database',
          timestamp: new Date().toLocaleTimeString(),
          status: 'ERROR',
        },
        ...prev.slice(0, 19),
      ]);
      return;
    }

    // Match Found!
    playScanSuccessSound();
    setActiveScannedSample(matched);

    let actionLabel = 'Sample Details Retrieved';
    let statusOutcome: 'SUCCESS' | 'WARNING' = 'SUCCESS';

    if (scanMode === 'PICKUP') {
      if (matched.status === 'PICKED UP' || matched.status === 'IN TRANSIT') {
        actionLabel = `Warning: Already ${matched.status}`;
        statusOutcome = 'WARNING';
      } else {
        await updateSampleStatus(
          matched.sampleId,
          matched.id,
          'PICKED UP',
          { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
          matched.centreName,
          'Scanned for collector pickup'
        );
        actionLabel = 'Status updated to PICKED UP';
      }
    } else if (scanMode === 'DISPATCH') {
      await updateSampleStatus(
        matched.sampleId,
        matched.id,
        'IN TRANSIT',
        { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
        'Transit Hub',
        'Scanned for batch dispatch to central lab'
      );
      actionLabel = 'Status updated to IN TRANSIT';
    } else if (scanMode === 'RECEIVE') {
      await updateSampleStatus(
        matched.sampleId,
        matched.id,
        'RECEIVED AND VERIFIED',
        { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
        'Central Reference Lab',
        'Scanned and verified at laboratory receiving dock'
      );
      actionLabel = 'Verified & Inwarded to Central Lab';
    }

    setScanHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        sampleId: matched.sampleId,
        barcode: matched.barcodeNumber,
        patientName: matched.patientName,
        testName: matched.testName,
        actionTaken: actionLabel,
        timestamp: new Date().toLocaleTimeString(),
        status: statusOutcome,
      },
      ...prev.slice(0, 19),
    ]);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processScannedCode(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Bar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Barcode className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                High-Speed Barcode & QR Code Scanner
              </h2>
              <p className="text-xs text-slate-500">
                Supports Mobile Camera, Bluetooth Handheld Scanners & USB Laser Barcode Guns
              </p>
            </div>
          </div>
        </div>

        {/* Scan Mode Switcher */}
        <div className="flex flex-wrap rounded-xl bg-slate-100 p-1.5 border border-slate-200">
          <button
            onClick={() => setScanMode('LOOKUP')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              scanMode === 'LOOKUP'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Quick Lookup
          </button>
          <button
            onClick={() => setScanMode('PICKUP')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              scanMode === 'PICKUP'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Pickup Scan
          </button>
          <button
            onClick={() => setScanMode('DISPATCH')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              scanMode === 'DISPATCH'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Dispatch Scan
          </button>
          <button
            onClick={() => setScanMode('RECEIVE')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              scanMode === 'RECEIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Lab Receiving
          </button>
        </div>
      </div>

      {/* Main Scanner Workstation Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Camera Viewfinder & Manual Input (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Camera Frame */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-sm">Optical Camera Viewfinder</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Volume2 className="h-3.5 w-3.5" /> Sound Active
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Keyboard className="h-3.5 w-3.5" /> USB Gun Ready
                </span>
              </div>
            </div>

            {/* Interactive HTML5 QR Region */}
            <div className="relative min-h-[260px] rounded-xl bg-slate-900 flex flex-col items-center justify-center overflow-hidden border border-slate-800">
              <div id={html5QrRegionId} className="w-full max-w-sm rounded-lg overflow-hidden" />

              {!isScanningCamera && (
                <div className="text-center p-6">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-blue-400">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    Camera Scanner in Standby
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    Tap below to launch live camera scanning or plug in any USB/Bluetooth barcode reader.
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-4 flex items-center gap-2 mx-auto rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    Activate Camera Scan
                  </button>
                </div>
              )}

              {isScanningCamera && (
                <div className="mt-3 flex justify-center pb-3">
                  <button
                    onClick={stopCamera}
                    className="rounded-lg bg-rose-600/90 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-700"
                  >
                    Pause Camera
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 rounded-lg bg-amber-950/80 p-3 text-xs text-amber-300 border border-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Manual Keyboard / Barcode Gun Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Keyboard className="h-4 w-4 text-blue-600" />
              Manual Code Entry / Bluetooth Gun Wedge
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Scan with any external barcode gun or type Sample ID / Barcode number (e.g., HP20261001A, HPS-2026-1001).
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter or scan barcode / QR / Sample ID..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                <Search className="h-4 w-4" />
                Lookup / Scan
              </button>
            </form>

            {/* Quick Demo Test Buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">Quick Test Samples:</span>
              {samples.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => processScannedCode(s.barcodeNumber)}
                  className="rounded-md bg-slate-100 px-2 py-1 font-mono text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition"
                >
                  {s.barcodeNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Scanned Sample Details & History (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Scanned Sample Card */}
          {activeScannedSample ? (
            <div className="rounded-2xl border-2 border-blue-500 bg-white p-5 shadow-lg">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {activeScannedSample.sampleId}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {activeScannedSample.patientName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeScannedSample.patientAge}Y / {activeScannedSample.patientGender} • Phone:{' '}
                    {activeScannedSample.patientMobile || 'N/A'}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase"
                  style={{
                    backgroundColor: `${activeScannedSample.containerColor || '#3b82f6'}20`,
                    color: activeScannedSample.containerColor || '#3b82f6',
                  }}
                >
                  {activeScannedSample.sampleType.split(' ')[0]}
                </span>
              </div>

              <div className="my-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Test:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {activeScannedSample.testName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collection Centre:</span>
                  <span className="font-semibold text-slate-800">
                    {activeScannedSample.centreName.split('-')[1]?.trim() || activeScannedSample.centreName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {activeScannedSample.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Barcode:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {activeScannedSample.barcodeNumber}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setPrintSample(activeScannedSample)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Sticker
                </button>
                <button
                  onClick={() => onOpenSampleDetail?.(activeScannedSample)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Full Record
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-slate-400">
              <Barcode className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-medium">Scan any vial or tube to inspect live details</p>
            </div>
          )}

          {/* Recent Scan History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Scan History & Audit Trail
              </h3>
              <span className="text-xs text-slate-400">{scanHistory.length} events</span>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {scanHistory.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No scan operations performed yet this session.
                </p>
              ) : (
                scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl p-2.5 text-xs border transition ${
                      item.status === 'SUCCESS'
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : item.status === 'WARNING'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                        : 'bg-rose-50/70 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">{item.barcode}</span>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                    <div className="mt-0.5 font-medium truncate">{item.patientName} • {item.testName}</div>
                    <div className="mt-1 text-[11px] font-semibold flex items-center gap-1">
                      {item.status === 'SUCCESS' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                      {item.status === 'WARNING' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                      {item.status === 'ERROR' && <AlertTriangle className="h-3 w-3 text-rose-500" />}
                      <span>{item.actionTaken}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Sticker Modal */}
      {printSample && (
        <PrintLabelModal
          sample={printSample}
          settings={settings}
          onClose={() => setPrintSample(null)}
        />
      )}
    </div>
  );
};
