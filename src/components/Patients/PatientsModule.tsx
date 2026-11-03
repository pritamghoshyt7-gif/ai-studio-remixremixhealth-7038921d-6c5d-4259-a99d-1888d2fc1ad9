import React, { useState } from 'react';
import { CollectionCentre, Patient, Sample, UserProfile } from '../../types';
import { savePatient, generatePatientId } from '../../services/dbService';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Activity,
  X,
  ExternalLink,
} from 'lucide-react';

interface PatientsModuleProps {
  patients: Patient[];
  centres: CollectionCentre[];
  samples: Sample[];
  currentUser: UserProfile;
  onBookSampleForPatient?: (patient: Patient) => void;
  onOpenSampleDetail?: (sample: Sample) => void;
}

export const PatientsModule: React.FC<PatientsModuleProps> = ({
  patients,
  centres,
  samples,
  currentUser,
  onBookSampleForPatient,
  onOpenSampleDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCentreFilter, setSelectedCentreFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Patient | null>(null);

  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    age: 35,
    gender: 'Male',
    mobileNumber: '',
    address: '',
    centreId: centres[0]?.id || '',
  });

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mobileNumber.includes(searchTerm) ||
      p.centreName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCentre = selectedCentreFilter === 'ALL' || p.centreId === selectedCentreFilter;

    return matchesSearch && matchesCentre;
  });

  const handleOpenAdd = () => {
    setFormData({
      id: generatePatientId('HPP-'),
      name: '',
      age: 32,
      gender: 'Male',
      mobileNumber: '+91 ',
      address: '',
      centreId: centres[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.centreId) return;

    const matchedCentre = centres.find((c) => c.id === formData.centreId);

    const patientToSave: Patient = {
      id: formData.id || generatePatientId('HPP-'),
      name: formData.name,
      age: Number(formData.age) || 30,
      gender: (formData.gender as any) || 'Male',
      mobileNumber: formData.mobileNumber || '',
      address: formData.address || '',
      centreId: formData.centreId,
      centreName: matchedCentre?.name || 'Central Lab Intake',
      registrationDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await savePatient(patientToSave, { uid: currentUser.id, name: currentUser.name });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Diagnostic Directory</h2>
            <p className="text-xs text-slate-500">
              Auto-generated patient identities, demographic records, and longitudinal sample histories
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Register Patient
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
            placeholder="Search by Patient Name, ID (HPP-...), phone number or address..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <select
            value={selectedCentreFilter}
            onChange={(e) => setSelectedCentreFilter(e.target.value)}
            className="bg-transparent font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">All Collection Centres</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
              <tr>
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Patient Demographics</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Registered Centre</th>
                <th className="py-3.5 px-4">Reg. Date</th>
                <th className="py-3.5 px-4 text-center">Samples</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const patientSamples = samples.filter((s) => s.patientId === patient.id);
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {patient.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{patient.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {patient.age} Yrs • {patient.gender}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {patient.mobileNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {patient.centreName.split('-')[1]?.trim() || patient.centreName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {patient.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {patient.registrationDate || patient.createdAt.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700">
                          {patientSamples.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedPatientHistory(patient)}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                          >
                            History
                          </button>
                          <button
                            onClick={() => onBookSampleForPatient?.(patient)}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                          >
                            + New Sample
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

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Register New Patient</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Soumitra Chatterjee"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Age (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Gender *</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobileNumber || ''}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91 98300 00000"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Residential Address</label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Flat/House, Locality, City..."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Collection Centre *</label>
                <select
                  value={formData.centreId || ''}
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

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Drawer */}
      {selectedPatientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {selectedPatientHistory.id}
                </span>
                <h3 className="font-bold text-lg text-slate-900">{selectedPatientHistory.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedPatientHistory.age}Y • {selectedPatientHistory.gender} •{' '}
                  {selectedPatientHistory.mobileNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientHistory(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Diagnostic Test History
                </h4>
                <button
                  onClick={() => {
                    onBookSampleForPatient?.(selectedPatientHistory);
                    setSelectedPatientHistory(null);
                  }}
                  className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                >
                  + Add Sample
                </button>
              </div>

              {samples.filter((s) => s.patientId === selectedPatientHistory.id).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                  No samples collected for this patient yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {samples
                    .filter((s) => s.patientId === selectedPatientHistory.id)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-blue-700">
                              {s.sampleId}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900 mt-0.5">{s.testName}</h5>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: `${s.containerColor || '#3b82f6'}20`,
                              color: s.containerColor || '#3b82f6',
                            }}
                          >
                            {s.sampleType.split(' ')[0]}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <span>Status:</span>
                          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {s.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Barcode: {s.barcodeNumber}</span>
                          <button
                            onClick={() => {
                              onOpenSampleDetail?.(s);
                              setSelectedPatientHistory(null);
                            }}
                            className="font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            Timeline <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
