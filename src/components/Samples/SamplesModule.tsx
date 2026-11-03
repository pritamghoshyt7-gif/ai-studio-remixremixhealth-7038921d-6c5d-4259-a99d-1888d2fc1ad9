import React, { useState } from 'react';
import {
  CollectionCentre,
  Collector,
  Patient,
  Sample,
  SampleStatus,
  SystemSettings,
  UserProfile,
} from '../../types';
import {
  saveSample,
  updateSampleStatus,
  generateSampleId,
  generateBarcode,
} from '../../services/dbService';
import { TEST_CATALOG } from '../../services/seedData';
import { PrintLabelModal } from '../Scanner/PrintLabelModal';
import {
  TestTubes,
  Plus,
  Search,
  Filter,
  Printer,
  MessageSquare,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  MapPin,
  Calendar,
  Send,
} from 'lucide-react';
import { formatWhatsAppMessage, getWhatsAppClickToChatUrl } from '../../services/whatsappService';

interface SamplesModuleProps {
  samples: Sample[];
  patients: Patient[];
  centres: CollectionCentre[];
  collectors: Collector[];
  currentUser: UserProfile;
  settings: SystemSettings;
  preselectedPatient?: Patient | null;
  onClearPreselectedPatient?: () => void;
  activeDetailSample?: Sample | null;
  onCloseDetail?: () => void;
  onOpenDetail?: (sample: Sample) => void;
}

export const SamplesModule: React.FC<SamplesModuleProps> = ({
  samples,
  patients,
  centres,
  collectors,
  currentUser,
  settings,
  preselectedPatient,
  onClearPreselectedPatient,
  activeDetailSample,
  onCloseDetail,
  onOpenDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [centreFilter, setCentreFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printingSample, setPrintingSample] = useState<Sample | null>(null);
  const [statusTransitionModal, setStatusTransitionModal] = useState<Sample | null>(null);
  const [newStatusSelected, setNewStatusSelected] = useState<SampleStatus>('COLLECTED');
  const [statusRemarks, setStatusRemarks] = useState('');

  // New Sample Form State
  const [formData, setFormData] = useState({
    patientId: '',
    centreId: '',
    testCatalogId: TEST_CATALOG[0]?.id || '',
    destinationLab: 'Health Point Central Reference Lab, Kolkata',
    collectorName: '',
    collectorId: '',
    remarks: '',
    temperature: 'Ambient 20-25°C',
  });

  // Open add modal automatically if preselectedPatient is provided
  React.useEffect(() => {
    if (preselectedPatient) {
      setFormData((prev) => ({
        ...prev,
        patientId: preselectedPatient.id,
        centreId: preselectedPatient.centreId,
      }));
      setIsAddModalOpen(true);
    }
  }, [preselectedPatient]);

  const allStatuses: SampleStatus[] = [
    'REGISTERED',
    'COLLECTED',
    'PICKUP REQUESTED',
    'PICKED UP',
    'IN TRANSIT',
    'ARRIVED AT LAB',
    'RECEIVED AND VERIFIED',
    'PROCESSING',
    'COMPLETED',
    'DELIVERED',
    'REJECTED',
    'ON HOLD',
    'CANCELLED',
  ];

  const filteredSamples = samples.filter((s) => {
    const matchesSearch =
      s.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.barcodeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.testName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesCentre = centreFilter === 'ALL' || s.centreId === centreFilter;

    return matchesSearch && matchesStatus && matchesCentre;
  });

  const handleOpenAddModal = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      centreId: centres[0]?.id || '',
      testCatalogId: TEST_CATALOG[0]?.id || '',
      destinationLab: 'Health Point Central Reference Lab, Kolkata',
      collectorName: collectors[0]?.name || '',
      collectorId: collectors[0]?.id || '',
      remarks: '',
      temperature: 'Ambient 20-25°C',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateSample = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === formData.patientId);
    const centre = centres.find((c) => c.id === formData.centreId);
    const catalogItem = TEST_CATALOG.find((t) => t.id === formData.testCatalogId);

    if (!patient || !centre || !catalogItem) return;

    const sampleId = generateSampleId(settings.sampleIdPrefix);
    const barcode = generateBarcode(settings.barcodePrefix);
    const qr = `HP-SMP-${barcode}-${catalogItem.id.toUpperCase()}`;

    const newSample: Sample = {
      id: `smp-${Date.now()}`,
      sampleId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientMobile: patient.mobileNumber,
      centreId: centre.id,
      centreName: centre.name,
      testName: catalogItem.name,
      testCategory: catalogItem.category,
      sampleType: catalogItem.sampleType,
      barcodeNumber: barcode,
      qrCode: qr,
      collectionDateTime: new Date().toISOString(),
      collectorName: formData.collectorName || 'Desk Operator',
      collectorId: formData.collectorId,
      destinationLab: formData.destinationLab,
      status: 'COLLECTED',
      remarks: formData.remarks || `Container: ${catalogItem.container}`,
      temperature: formData.temperature,
      containerColor: catalogItem.containerColor,
      movementHistory: [
        {
          status: 'REGISTERED',
          timestamp: new Date().toISOString(),
          performedBy: currentUser.id,
          performedByName: `${currentUser.name} (${currentUser.role})`,
          location: centre.name,
          remarks: 'Sample registered & barcoded',
        },
        {
          status: 'COLLECTED',
          timestamp: new Date().toISOString(),
          performedBy: currentUser.id,
          performedByName: `${currentUser.name} (${currentUser.role})`,
          location: centre.name,
          remarks: `Specimen collected in ${catalogItem.container}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveSample(newSample, { uid: currentUser.id, name: currentUser.name });
    setIsAddModalOpen(false);
    onClearPreselectedPatient?.();
    setPrintingSample(newSample); // Immediately prompt to print sticker!
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTransitionModal) return;

    await updateSampleStatus(
      statusTransitionModal.sampleId,
      statusTransitionModal.id,
      newStatusSelected,
      { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
      currentUser.role === 'Lab Receiver' ? 'Central Lab Inward Dock' : 'Transit Point',
      statusRemarks
    );

    setStatusTransitionModal(null);
    setStatusRemarks('');
  };

  const handleWhatsAppAlert = (sample: Sample) => {
    const message = formatWhatsAppMessage(
      settings.whatsappEnglishTemplate,
      sample,
      settings,
      sample.patientName
    );
    const url = getWhatsAppClickToChatUrl(sample.patientMobile || '+91 98300 00000', message);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <TestTubes className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Diagnostic Sample Logistics & Movement ERP
            </h2>
            <p className="text-xs text-slate-500">
              End-to-end biological chain of custody from phlebotomy at collection centre to central lab verification
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Intake New Sample
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Sample ID (HPS-...), Patient Name, Barcode or Test Name..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-hidden"
            >
              <option value="ALL">All Statuses ({samples.length})</option>
              {allStatuses.map((st) => (
                <option key={st} value={st}>
                  {st} ({samples.filter((s) => s.status === st).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <select
              value={centreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-hidden"
            >
              <option value="ALL">All Centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Samples Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
              <tr>
                <th className="py-3.5 px-4">Sample ID & Barcode</th>
                <th className="py-3.5 px-4">Patient Details</th>
                <th className="py-3.5 px-4">Diagnostic Test & Specimen</th>
                <th className="py-3.5 px-4">Origin Centre</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Runner</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No samples found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => {
                  const isReceived = sample.status === 'RECEIVED AND VERIFIED';
                  const isInTransit =
                    sample.status === 'IN TRANSIT' || sample.status === 'PICKED UP';
                  const isRejected = sample.status === 'REJECTED';

                  return (
                    <tr key={sample.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-600">{sample.sampleId}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          BC: {sample.barcodeNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sample.patientName}</div>
                        <div className="text-[10px] text-slate-500">
                          {sample.patientAge ? `${sample.patientAge}Y / ` : ''}
                          {sample.patientGender || ''} • {sample.patientMobile || 'No Phone'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{sample.testName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: sample.containerColor || '#3b82f6' }}
                          />
                          <span className="text-[10px] text-slate-500">{sample.sampleType}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">
                          {sample.centreName.split('-')[1]?.trim() || sample.centreName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(sample.collectionDateTime || sample.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInTransit
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {sample.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {sample.collectorName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingSample(sample)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Print Barcode Label"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleWhatsAppAlert(sample)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Send WhatsApp Update"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStatusTransitionModal(sample);
                              setNewStatusSelected(sample.status);
                            }}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => onOpenDetail?.(sample)}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                          >
                            Track
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intake New Sample Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Diagnostic Sample Intake & Barcoding
                </h3>
                <p className="text-xs text-slate-500">
                  Generates unique Code 128 barcode, QR label, and starts logistics tracking
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  onClearPreselectedPatient?.();
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) • {p.age}Y, {p.gender} • {p.mobileNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Collection Centre *</label>
                <select
                  required
                  value={formData.centreId}
                  onChange={(e) => setFormData({ ...formData, centreId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.centreCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Diagnostic Test from Catalog *
                </label>
                <select
                  required
                  value={formData.testCatalogId}
                  onChange={(e) => setFormData({ ...formData, testCatalogId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                >
                  {TEST_CATALOG.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} • {t.sampleType} (₹{t.rate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Assigned Collector</label>
                  <select
                    value={formData.collectorId}
                    onChange={(e) => {
                      const col = collectors.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        collectorId: e.target.value,
                        collectorName: col?.name || '',
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="">Unassigned Phlebotomist</option>
                    {collectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.collectorId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Temperature Spec</label>
                  <input
                    type="text"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Destination Laboratory</label>
                <input
                  type="text"
                  value={formData.destinationLab}
                  onChange={(e) => setFormData({ ...formData, destinationLab: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Remarks / Clinical Notes</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Fasting sample, STAT requested"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                >
                  Create & Print Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Status Transition Modal */}
      {statusTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {statusTransitionModal.sampleId}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Update Sample Movement Status
                </h3>
              </div>
              <button
                onClick={() => setStatusTransitionModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Status *</label>
                <select
                  value={newStatusSelected}
                  onChange={(e) => setNewStatusSelected(e.target.value as SampleStatus)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 outline-hidden"
                >
                  {allStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Remarks / Location</label>
                <input
                  type="text"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="e.g. Handed to lab receiving desk"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setStatusTransitionModal(null)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sample Detail Drawer with Chain-of-Custody Timeline */}
      {activeDetailSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {activeDetailSample.sampleId}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {activeDetailSample.patientName}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeDetailSample.testName} • BC: {activeDetailSample.barcodeNumber}
                </p>
              </div>
              <button
                onClick={onCloseDetail}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Status Pill & Quick Print */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Live Status:
                </span>
                <div className="font-bold text-sm text-emerald-700">
                  {activeDetailSample.status}
                </div>
              </div>
              <button
                onClick={() => setPrintingSample(activeDetailSample)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Sticker
              </button>
            </div>

            {/* Movement Timeline */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
                Chain-of-Custody Movement Trail
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                {activeDetailSample.movementHistory?.map((mv, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-100" />
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{mv.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(mv.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">{mv.performedByName}</span>
                        {mv.location && <span className="text-slate-400"> • {mv.location}</span>}
                      </div>
                      {mv.remarks && (
                        <div className="mt-1 rounded bg-slate-50 p-1.5 text-[11px] text-slate-500 italic">
                          "{mv.remarks}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={() => handleWhatsAppAlert(activeDetailSample)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
              >
                <Send className="h-4 w-4" />
                WhatsApp Patient Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sticker Modal */}
      {printingSample && (
        <PrintLabelModal
          sample={printingSample}
          settings={settings}
          onClose={() => setPrintingSample(null)}
        />
      )}
    </div>
  );
};
