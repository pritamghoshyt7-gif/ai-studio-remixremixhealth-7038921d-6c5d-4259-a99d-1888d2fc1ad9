import React, { useState } from 'react';
import { CollectionCentre, LabReceipt, Sample, UserProfile } from '../../types';
import { saveLabReceipt, updateSampleStatus } from '../../services/dbService';
import { playScanSuccessSound, playScanErrorSound } from '../../services/barcodeService';
import {
  Sparkles,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Printer,
  Search,
  Check,
  RotateCcw,
  PackageCheck,
  X,
} from 'lucide-react';

interface LabReceivingModuleProps {
  samples: Sample[];
  centres: CollectionCentre[];
  currentUser: UserProfile;
}

export const LabReceivingModule: React.FC<LabReceivingModuleProps> = ({
  samples,
  centres,
  currentUser,
}) => {
  const [inwardScanInput, setInwardScanInput] = useState('');
  const [scannedSampleIds, setScannedSampleIds] = useState<string[]>([]);
  const [rejectingSample, setRejectingSample] = useState<Sample | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Hemolysed Specimen');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [generatedManifest, setGeneratedManifest] = useState<LabReceipt | null>(null);

  // Incoming samples ready for verification (ARRIVED AT LAB or IN TRANSIT)
  const incomingQueue = samples.filter(
    (s) =>
      s.status === 'ARRIVED AT LAB' ||
      s.status === 'IN TRANSIT' ||
      s.status === 'RECEIVED AND VERIFIED'
  );

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inwardScanInput.trim();
    if (!code) return;

    const matched = samples.find(
      (s) =>
        s.barcodeNumber.toLowerCase() === code.toLowerCase() ||
        s.sampleId.toLowerCase() === code.toLowerCase()
    );

    if (!matched) {
      playScanErrorSound();
      alert(`Barcode "${code}" not found in current logistics database!`);
      setInwardScanInput('');
      return;
    }

    playScanSuccessSound();
    if (!scannedSampleIds.includes(matched.id)) {
      setScannedSampleIds((prev) => [...prev, matched.id]);
    }

    // Auto update status to RECEIVED AND VERIFIED
    await updateSampleStatus(
      matched.sampleId,
      matched.id,
      'RECEIVED AND VERIFIED',
      { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
      'Central Reference Lab Inward Station',
      `Verified via Inward Scan by ${currentUser.name}`
    );

    setInwardScanInput('');
  };

  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSample) return;

    await updateSampleStatus(
      rejectingSample.sampleId,
      rejectingSample.id,
      'REJECTED',
      { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
      'Central Reference Lab Inward Station',
      `Sample Rejected: ${rejectionReason}. Details: ${rejectionNotes || 'None'}`
    );

    setRejectingSample(null);
    setRejectionNotes('');
  };

  const handleGenerateManifest = async () => {
    const manifestNumber = `MNF-${Date.now().toString().slice(-6)}`;
    const verifiedSamples = samples.filter((s) => scannedSampleIds.includes(s.id));
    const damagedSamples = verifiedSamples.filter((s) => s.status === 'REJECTED');

    const receipt: LabReceipt = {
      id: `rcpt-${Date.now()}`,
      manifestNumber,
      receivedAt: new Date().toISOString(),
      receiverName: currentUser.name,
      receiverUserId: currentUser.id,
      scannedSampleIds,
      verifiedCount: verifiedSamples.length,
      missingCount: 0,
      damagedCount: damagedSamples.length,
      rejectionNotes: 'Batch verified and cleared for analytical processing.',
      createdAt: new Date().toISOString(),
    };

    await saveLabReceipt(receipt, { uid: currentUser.id, name: currentUser.name });
    setGeneratedManifest(receipt);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Central Reference Laboratory Inward Dock
            </h2>
            <p className="text-xs text-slate-500">
              High-speed barcode verification, specimen integrity check (hemolysis, clotting, volume), and manifest generation
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateManifest}
          disabled={scannedSampleIds.length === 0}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md ${
            scannedSampleIds.length > 0
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Generate Receiving Manifest ({scannedSampleIds.length})
        </button>
      </div>

      {/* Rapid Scan-in Barcode Gun Station */}
      <div className="rounded-2xl border-2 border-blue-500 bg-blue-50/40 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Barcode className="h-5 w-5 text-blue-600" />
            Rapid Inward Barcode Scan-to-Verify
          </h3>
          <span className="text-xs font-semibold text-blue-700">
            {scannedSampleIds.length} Verified in Current Batch
          </span>
        </div>

        <form onSubmit={handleScanSubmit} className="flex gap-2">
          <input
            type="text"
            value={inwardScanInput}
            onChange={(e) => setInwardScanInput(e.target.value)}
            placeholder="Scan vial barcode with USB/Bluetooth gun or type barcode..."
            className="flex-1 rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
            autoFocus
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition"
          >
            <Check className="h-4 w-4" />
            Verify & Inward
          </button>
        </form>
      </div>

      {/* Incoming Samples Manifest Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Incoming Specimen Batch ({incomingQueue.length} Samples)
          </h3>
          <span className="text-xs text-slate-500">
            Click 'Reject' to report hemolysed, clotted, or insufficient samples
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
              <tr>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Sample ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Diagnostic Test</th>
                <th className="py-3 px-4">Origin Centre</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Integrity Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomingQueue.map((sample) => {
                const isVerified =
                  scannedSampleIds.includes(sample.id) ||
                  sample.status === 'RECEIVED AND VERIFIED';
                const isRejected = sample.status === 'REJECTED';

                return (
                  <tr key={sample.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      {isVerified ? (
                        <span className="flex items-center gap-1 font-bold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Verified
                        </span>
                      ) : isRejected ? (
                        <span className="flex items-center gap-1 font-bold text-rose-600">
                          <XCircle className="h-4 w-4" /> Rejected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-amber-600">
                          <AlertTriangle className="h-4 w-4" /> Awaiting Inward
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {sample.sampleId}
                      <div className="text-[10px] text-slate-400">{sample.barcodeNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{sample.patientName}</div>
                      <div className="text-[10px] text-slate-400">
                        {sample.patientAge}Y / {sample.patientGender}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{sample.testName}</div>
                      <div className="text-[10px] text-slate-500">{sample.sampleType}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {sample.centreName.split('-')[1]?.trim() || sample.centreName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sample.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isVerified && !isRejected && (
                          <button
                            onClick={async () => {
                              playScanSuccessSound();
                              setScannedSampleIds((prev) => [...prev, sample.id]);
                              await updateSampleStatus(
                                sample.sampleId,
                                sample.id,
                                'RECEIVED AND VERIFIED',
                                { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
                                'Central Lab Inward Dock',
                                'Direct manual verification'
                              );
                            }}
                            className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark Verified
                          </button>
                        )}
                        <button
                          onClick={() => setRejectingSample(sample)}
                          className="rounded-lg border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Reject Specimen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Specimen Modal */}
      {rejectingSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-rose-600">
                  {rejectingSample.sampleId}
                </span>
                <h3 className="font-bold text-slate-900 text-base">Report Specimen Rejection</h3>
              </div>
              <button
                onClick={() => setRejectingSample(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRejection} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Rejection Cause *</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-hidden"
                >
                  <option value="Hemolysed Specimen">Hemolysed Specimen (Red/Pink serum)</option>
                  <option value="Clotted EDTA Tube">Clotted Specimen in EDTA Tube</option>
                  <option value="Insufficient Volume (QNS)">Insufficient Volume (QNS)</option>
                  <option value="Leaked / Cracked Container">Leaked / Cracked Container</option>
                  <option value="Wrong Vacutainer Tube Type">Wrong Vacutainer Tube Type</option>
                  <option value="Unlabelled / Mismatched Vial">Unlabelled / Mismatched Vial</option>
                  <option value="Temperature Abuse / Warm Transport">Temperature Abuse / Warm Transport</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Detailed Lab Notes</label>
                <textarea
                  rows={2}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Red blood cell lysis detected upon spin. Immediate recollect advised."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setRejectingSample(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Inward Manifest Dialog */}
      {generatedManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  MANIFEST #{generatedManifest.manifestNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">
                  Central Laboratory Inward Manifest
                </h3>
              </div>
              <button
                onClick={() => setGeneratedManifest(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <span className="text-slate-400">Total Verified:</span>
                  <div className="text-lg font-bold text-slate-900">
                    {generatedManifest.verifiedCount}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Rejections:</span>
                  <div className="text-lg font-bold text-rose-600">
                    {generatedManifest.damagedCount}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Receiver:</span>
                  <div className="font-semibold text-slate-800">
                    {generatedManifest.receiverName}
                  </div>
                </div>
              </div>

              <p className="text-slate-500">
                Timestamp: {new Date(generatedManifest.receivedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setGeneratedManifest(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Print Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
