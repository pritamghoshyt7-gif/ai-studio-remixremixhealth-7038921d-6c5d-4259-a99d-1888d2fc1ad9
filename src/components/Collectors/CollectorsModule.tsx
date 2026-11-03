import React, { useState } from 'react';
import { CollectionCentre, Collector, GpsDevice, Sample, UserProfile } from '../../types';
import { saveCollector } from '../../services/dbService';
import {
  Truck,
  Plus,
  Phone,
  MessageSquare,
  Battery,
  Zap,
  MapPin,
  CheckCircle,
  XCircle,
  Award,
  X,
  ExternalLink,
} from 'lucide-react';

interface CollectorsModuleProps {
  collectors: Collector[];
  centres: CollectionCentre[];
  gpsDevices: GpsDevice[];
  samples: Sample[];
  currentUser: UserProfile;
}

export const CollectorsModule: React.FC<CollectorsModuleProps> = ({
  collectors,
  centres,
  gpsDevices,
  samples,
  currentUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollector, setEditingCollector] = useState<Collector | null>(null);

  const [formData, setFormData] = useState<Partial<Collector>>({
    name: '',
    collectorId: '',
    mobileNumber: '+91 ',
    whatsappNumber: '+91 ',
    employeeId: '',
    assignedCentres: [],
    assignedGpsDeviceId: '',
    assignedVehicle: '',
    status: 'ON_DUTY',
  });

  const handleOpenAdd = () => {
    setEditingCollector(null);
    const nextNum = collectors.length + 1;
    setFormData({
      id: `col-${Date.now()}`,
      collectorId: `HPR-0${nextNum}`,
      name: '',
      mobileNumber: '+91 ',
      whatsappNumber: '+91 ',
      employeeId: `EMP-LOG-${100 + nextNum}`,
      assignedCentres: [centres[0]?.id || ''],
      assignedGpsDeviceId: gpsDevices[0]?.id || '',
      assignedVehicle: 'Hero Glamour (WB-02-AK-4412)',
      status: 'ON_DUTY',
      currentLatitude: 22.5726,
      currentLongitude: 88.3639,
      batteryLevel: 90,
      speedKmh: 30,
      isOnline: true,
      dailyCollectionsCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: Collector) => {
    setEditingCollector(col);
    setFormData(col);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.collectorId) return;

    const collectorToSave: Collector = {
      id: formData.id || `col-${Date.now()}`,
      collectorId: formData.collectorId,
      name: formData.name,
      mobileNumber: formData.mobileNumber || '',
      whatsappNumber: formData.whatsappNumber || formData.mobileNumber || '',
      employeeId: formData.employeeId || 'EMP-LOG-101',
      assignedCentres: formData.assignedCentres || [],
      assignedGpsDeviceId: formData.assignedGpsDeviceId,
      assignedVehicle: formData.assignedVehicle || 'Motorcycle',
      status: formData.status || 'ON_DUTY',
      currentLatitude: formData.currentLatitude || 22.5726,
      currentLongitude: formData.currentLongitude || 88.3639,
      lastLocationUpdate: new Date().toISOString(),
      batteryLevel: formData.batteryLevel || 85,
      speedKmh: formData.speedKmh || 0,
      isOnline: formData.status === 'ON_DUTY',
      dailyCollectionsCount: formData.dailyCollectionsCount || 0,
    };

    await saveCollector(collectorToSave, { uid: currentUser.id, name: currentUser.name });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Field Phlebotomist & Logistics Collector Roster
            </h2>
            <p className="text-xs text-slate-500">
              Manage field personnel, assigned transport vehicles, hardware trackers, and daily performance metrics
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Register Collector
        </button>
      </div>

      {/* Collectors Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {collectors.map((collector) => {
          const matchedDevice = gpsDevices.find((d) => d.id === collector.assignedGpsDeviceId);
          const collectorSamples = samples.filter((s) => s.collectorName === collector.name);

          return (
            <div
              key={collector.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600">
                    {collector.collectorId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      collector.status === 'ON_DUTY'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {collector.status === 'ON_DUTY' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {collector.status}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{collector.name}</h3>
                <p className="text-xs text-slate-500">{collector.employeeId}</p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Vehicle:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                      {collector.assignedVehicle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GPS Tracker:</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {matchedDevice ? matchedDevice.deviceName : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Battery & Speed:</span>
                    <span className="font-semibold text-slate-800">
                      {collector.batteryLevel}% • {collector.speedKmh} km/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Samples:</span>
                    <span className="font-bold text-blue-600">
                      {collectorSamples.length} assigned
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <a
                    href={`tel:${collector.mobileNumber}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Call Collector"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <a
                    href={`https://wa.me/${collector.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                    title="WhatsApp"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                </div>

                <button
                  onClick={() => handleOpenEdit(collector)}
                  className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register/Edit Collector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCollector ? 'Edit Collector Profile' : 'Register Field Collector'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Collector Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Subrata Mukherjee"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Collector ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.collectorId || ''}
                    onChange={(e) => setFormData({ ...formData, collectorId: e.target.value })}
                    placeholder="HPR-01"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobileNumber || ''}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+91 98301 77889"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP-LOG-101"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assigned Vehicle</label>
                <input
                  type="text"
                  value={formData.assignedVehicle || ''}
                  onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                  placeholder="e.g. Hero Glamour (WB-02-AK-4412)"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Assigned GPS Tracker</label>
                  <select
                    value={formData.assignedGpsDeviceId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedGpsDeviceId: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="">None / Mobile GPS Only</option>
                    {gpsDevices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.deviceName} ({d.deviceProtocol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Duty Status</label>
                  <select
                    value={formData.status || 'ON_DUTY'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="ON_DUTY">ON DUTY (Active)</option>
                    <option value="OFF_DUTY">OFF DUTY</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Save Collector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
