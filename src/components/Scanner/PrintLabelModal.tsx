import React, { useEffect, useRef } from 'react';
import { Sample, SystemSettings } from '../../types';
import { renderBarcodeSvg, generateQrDataUrl } from '../../services/barcodeService';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface PrintLabelModalProps {
  sample: Sample | null;
  settings: SystemSettings;
  onClose: () => void;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  sample,
  settings,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrUrl, setQrUrl] = React.useState<string>('');

  useEffect(() => {
    if (!sample) return;
    renderBarcodeSvg(svgRef.current, sample.barcodeNumber || sample.sampleId);
    generateQrDataUrl(sample.qrCode || sample.sampleId).then((url) => setQrUrl(url));
  }, [sample]);

  if (!sample) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Print Diagnostic Vial Label</h3>
              <p className="text-xs text-slate-500">Standard 2" × 1" Laboratory Thermal Sticker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Label Preview Box */}
        <div className="my-6 flex justify-center">
          <div
            id="thermal-sticker-label"
            className="w-96 rounded-lg border-2 border-dashed border-slate-300 bg-white p-4 shadow-sm text-slate-900 font-mono"
            style={{ minHeight: '180px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 text-[11px] font-bold">
              <span className="text-blue-700 tracking-wider">HEALTH POINT LABS</span>
              <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] text-slate-700">
                {sample.centreName.split('-')[1]?.trim() || sample.centreId}
              </span>
            </div>

            {/* Patient & Test Details */}
            <div className="my-1.5 flex justify-between text-[11px]">
              <div>
                <div className="font-bold text-slate-900 truncate max-w-[200px]">
                  {sample.patientName}
                </div>
                <div className="text-[10px] text-slate-600">
                  {sample.patientAge ? `${sample.patientAge}Y` : ''} / {sample.patientGender || 'Gen'} • ID: {sample.patientId}
                </div>
              </div>
              <div className="text-right">
                <span
                  className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold text-white uppercase"
                  style={{ backgroundColor: sample.containerColor || '#3b82f6' }}
                >
                  {sample.sampleType.split(' ')[0]}
                </span>
                <div className="text-[9px] text-slate-500">
                  {new Date(sample.collectionDateTime || sample.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {/* Test Name */}
            <div className="text-[11px] font-semibold text-slate-800 truncate border-t border-slate-100 pt-1">
              {sample.testName}
            </div>

            {/* Barcode and QR Section */}
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="flex-1 overflow-hidden">
                <svg ref={svgRef} className="w-full max-h-12" />
              </div>
              {qrUrl && (
                <div className="shrink-0">
                  <img src={qrUrl} alt="Sample QR" className="h-12 w-12 rounded border border-slate-200" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-1 flex justify-between text-[8px] text-slate-400 border-t border-slate-200 pt-0.5">
              <span>DEST: CENTRAL LAB</span>
              <span>BARCODE: {sample.barcodeNumber}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Compatible with Zebra, TSC, Dymo, TVS printers
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Print Sticker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
