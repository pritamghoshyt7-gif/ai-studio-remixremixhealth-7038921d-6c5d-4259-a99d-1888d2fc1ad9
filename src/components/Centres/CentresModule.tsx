import React, { useState } from 'react';
import { CollectionCentre, Collector, Sample, UserProfile } from '../../types';
import { saveCentre, deleteCentre, generateCentreId } from '../../services/dbService';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Clock,
  User,
  CheckCircle,
  XCircle,
  ExternalLink,
  X,
  MessageSquare,
} from 'lucide-react';

interface CentresModuleProps {
  centres: CollectionCentre[];
  collectors: Collector[];
  samples: Sample[];
  currentUser: UserProfile;
}

export const CentresModule: React.FC<CentresModuleProps> = ({
  centres,
  collectors,
  samples,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCentreForStats, setSelectedCentreForStats] = useState<CollectionCentre | null>(null);

  // Form State
  const [editingCentre, setEditingCentre] = useState<CollectionCentre | null>(null);
  const [formData, setFormData] = useState<Partial<CollectionCentre>>({
    name: '',
    centreCode: '',
    ownerName: '',
    contactPerson: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    fullAddress: '',
    pinCode: '',
    state: 'West Bengal',
    district: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    openingTime: '07:00 AM',
    closingTime: '08:00 PM',
    assignedCollectorId: '',
    status: 'ACTIVE',
  });

  const districts = Array.from(new Set(centres.map((c) => c.district))).filter(Boolean);

  const filteredCentres = centres.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.centreCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDistrict = districtFilter === 'ALL' || c.district === districtFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingCentre(null);
    const newCode = `HPC-${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      id: generateCentreId('hpc-'),
      name: '',
      centreCode: newCode,
      ownerName: '',
      contactPerson: '',
      mobileNumber: '',
      whatsappNumber: '',
      email: '',
      fullAddress: '',
      pinCode: '700001',
      state: 'West Bengal',
      district: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      openingTime: '07:00 AM',
      closingTime: '08:00 PM',
      assignedCollectorId: collectors[0]?.id || '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (centre: CollectionCentre) => {
    setEditingCentre(centre);
    setFormData(centre);
    setIsModalOpen(true);
  };

  const handleDelete = async (centre: CollectionCentre) => {
    if (window.confirm(`Are you sure you want to delete ${centre.name}?`)) {
      await deleteCentre(centre.id, centre.name, {
        uid: currentUser.id,
        name: currentUser.name,
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.centreCode) return;

    const assignedCollector = collectors.find((c) => c.id === formData.assignedCollectorId);

    const centreToSave: CollectionCentre = {
      id: formData.id || generateCentreId('hpc-'),
      name: formData.name,
      centreCode: formData.centreCode,
      ownerName: formData.ownerName || '',
      contactPerson: formData.contactPerson || '',
      mobileNumber: formData.mobileNumber || '',
      whatsappNumber: formData.whatsappNumber || formData.mobileNumber || '',
      email: formData.email || '',
      fullAddress: formData.fullAddress || '',
      pinCode: formData.pinCode || '',
      state: formData.state || 'West Bengal',
      district: formData.district || 'Kolkata',
      latitude: Number(formData.latitude) || 22.5726,
      longitude: Number(formData.longitude) || 88.3639,
      openingTime: formData.openingTime || '07:00 AM',
      closingTime: formData.closingTime || '08:00 PM',
      assignedCollectorId: formData.assignedCollectorId,
      assignedCollectorName: assignedCollector?.name,
      status: formData.status || 'ACTIVE',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCentre(centreToSave, { uid: currentUser.id, name: currentUser.name });
    setIsModalOpen(false);
  };

  const exportCsv = () => {
    const headers = [
      'Centre ID',
      'Name',
      'Code',
      'Contact Person',
      'Mobile',
      'District',
      'Status',
      'Assigned Collector',
    ];
    const rows = filteredCentres.map((c) => [
      c.id,
      `"${c.name}"`,
      c.centreCode,
      `"${c.contactPerson}"`,
      c.mobileNumber,
      c.district,
      c.status,
      `"${c.assignedCollectorName || 'None'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `health_point_centres_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Unlimited Collection Centres Management
            </h2>
            <p className="text-xs text-slate-500">
              Centralized registry connecting unlimited partner hubs, clinic points & phlebotomy centers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Collection Centre
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by centre name, code, contact person or district..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-hidden"
            >
              <option value="ALL">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-medium text-slate-700 outline-hidden"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Centres</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Centres Grid Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredCentres.map((centre) => {
          const centreSamples = samples.filter((s) => s.centreId === centre.id);
          const pendingCount = centreSamples.filter(
            (s) => s.status === 'REGISTERED' || s.status === 'COLLECTED'
          ).length;

          return (
            <div
              key={centre.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                    {centre.centreCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      centre.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {centre.status === 'ACTIVE' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {centre.status}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {centre.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{centre.fullAddress}</span>
                </p>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> Contact:
                    </span>
                    <span className="font-semibold">{centre.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Mobile:
                    </span>
                    <a
                      href={`tel:${centre.mobileNumber}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {centre.mobileNumber}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Timing:
                    </span>
                    <span className="font-medium text-slate-700">
                      {centre.openingTime} - {centre.closingTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Collector:</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      {centre.assignedCollectorName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer / Stats & Actions */}
              <div className="mt-5 border-t border-slate-100 pt-3">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pending Pickups:</span>
                  <span
                    className={`font-bold rounded-full px-2 py-0.5 ${
                      pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pendingCount} samples
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(centre)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit Centre"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(centre)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete Centre"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <a
                      href={`https://wa.me/${centre.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                      title="WhatsApp Centre"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  </div>

                  <button
                    onClick={() => setSelectedCentreForStats(centre)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Centre Hub
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Centre Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCentre ? 'Edit Collection Centre' : 'Register New Collection Centre'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Centre Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Health Point Centre - Salt Lake"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Centre Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.centreCode || ''}
                    onChange={(e) => setFormData({ ...formData, centreCode: e.target.value })}
                    placeholder="e.g. HPC-SL01"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Dr. Debasish Roy"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Sanjay Ghosh"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobileNumber || ''}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+91 98311 22334"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">WhatsApp Number</label>
                  <input
                    type="text"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+91 98311 22334"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Full Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.fullAddress || ''}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  placeholder="Street, Landmark, City..."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">District</label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Kolkata / Howrah..."
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">PIN Code</label>
                  <input
                    type="text"
                    value={formData.pinCode || ''}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="700091"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">GPS Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude || 22.5726}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">GPS Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude || 88.3639}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Assigned Collector</label>
                  <select
                    value={formData.assignedCollectorId || ''}
                    onChange={(e) => setFormData({ ...formData, assignedCollectorId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="">Unassigned</option>
                    {collectors.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.collectorId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Opening Time</label>
                  <input
                    type="text"
                    value={formData.openingTime || '07:00 AM'}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Centre Status</label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
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
                  {editingCentre ? 'Update Centre' : 'Create Centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centre Details Dashboard Drawer */}
      {selectedCentreForStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {selectedCentreForStats.centreCode}
                </span>
                <h3 className="font-bold text-base text-slate-900">{selectedCentreForStats.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCentreForStats(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sample Volume Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-slate-400">Total Samples:</span>
                    <div className="text-lg font-bold text-slate-800">
                      {samples.filter((s) => s.centreId === selectedCentreForStats.id).length}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-slate-400">In Transit:</span>
                    <div className="text-lg font-bold text-amber-600">
                      {
                        samples.filter(
                          (s) =>
                            s.centreId === selectedCentreForStats.id &&
                            (s.status === 'IN TRANSIT' || s.status === 'PICKED UP')
                        ).length
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-700">Centre Profile</h4>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Address:</span>{' '}
                  {selectedCentreForStats.fullAddress}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">District:</span>{' '}
                  {selectedCentreForStats.district}, {selectedCentreForStats.state} -{' '}
                  {selectedCentreForStats.pinCode}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">GPS:</span>{' '}
                  {selectedCentreForStats.latitude}, {selectedCentreForStats.longitude}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedCentreForStats.latitude},${selectedCentreForStats.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <MapPin className="h-4 w-4 text-blue-600" />
                  View on Google Maps
                </a>
                <a
                  href={`https://wa.me/${selectedCentreForStats.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
