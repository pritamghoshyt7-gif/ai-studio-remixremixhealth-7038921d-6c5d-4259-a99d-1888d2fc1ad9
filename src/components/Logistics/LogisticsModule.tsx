import React, { useState } from 'react';
import { CollectionCentre, Collector, LogisticsTrip, Sample, UserProfile } from '../../types';
import { saveLogisticsTrip, updateSampleStatus } from '../../services/dbService';
import {
  Send,
  Plus,
  Truck,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  FileText,
} from 'lucide-react';

interface LogisticsModuleProps {
  trips: LogisticsTrip[];
  centres: CollectionCentre[];
  collectors: Collector[];
  samples: Sample[];
  currentUser: UserProfile;
}

export const LogisticsModule: React.FC<LogisticsModuleProps> = ({
  trips,
  centres,
  collectors,
  samples,
  currentUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    centreId: centres[0]?.id || '',
    collectorId: collectors[0]?.id || '',
    vehicleNumber: collectors[0]?.assignedVehicle || 'WB-02-AK-4412',
    destinationLab: 'Health Point Central Reference Lab, Kolkata',
    pickupTime: '10:30 AM',
    expectedDeliveryTime: '01:00 PM',
    selectedSampleIds: [] as string[],
    notes: 'Urgent cold chain courier batch',
  });

  // Samples available for pickup at selected centre
  const pendingSamplesAtCentre = samples.filter(
    (s) =>
      s.centreId === formData.centreId &&
      (s.status === 'COLLECTED' || s.status === 'PICKUP REQUESTED')
  );

  const handleOpenAdd = () => {
    const centre = centres[0];
    const initialPending = samples
      .filter((s) => s.centreId === centre?.id && (s.status === 'COLLECTED' || s.status === 'REGISTERED'))
      .map((s) => s.id);

    setFormData({
      centreId: centre?.id || '',
      collectorId: collectors[0]?.id || '',
      vehicleNumber: collectors[0]?.assignedVehicle || 'WB-02-AK-4412',
      destinationLab: 'Health Point Central Reference Lab, Kolkata',
      pickupTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedDeliveryTime: new Date(Date.now() + 7200000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      selectedSampleIds: initialPending,
      notes: 'Standard cold bag temperature: 2-8°C',
    });
    setIsModalOpen(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const centre = centres.find((c) => c.id === formData.centreId);
    const collector = collectors.find((c) => c.id === formData.collectorId);

    if (!centre || !collector) return;

    const tripCode = `TRIP-${Date.now().toString().slice(-6)}`;
    const newTrip: LogisticsTrip = {
      id: `trip-${Date.now()}`,
      tripCode,
      centreId: centre.id,
      centreName: centre.name,
      collectorId: collector.id,
      collectorName: collector.name,
      vehicleNumber: formData.vehicleNumber,
      destinationLab: formData.destinationLab,
      pickupTime: formData.pickupTime,
      expectedDeliveryTime: formData.expectedDeliveryTime,
      sampleCount: formData.selectedSampleIds.length || pendingSamplesAtCentre.length || 1,
      sampleIds: formData.selectedSampleIds,
      status: 'IN_TRANSIT',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    await saveLogisticsTrip(newTrip, { uid: currentUser.id, name: currentUser.name });

    // Mark samples as IN TRANSIT
    for (const sampleId of formData.selectedSampleIds) {
      const targetSample = samples.find((s) => s.id === sampleId);
      if (targetSample) {
        await updateSampleStatus(
          targetSample.sampleId,
          targetSample.id,
          'IN TRANSIT',
          { uid: currentUser.id, name: currentUser.name, role: currentUser.role },
          `Dispatched via Trip ${tripCode}`,
          `Handed to ${collector.name} (${formData.vehicleNumber})`
        );
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Logistics Dispatch & Transit Trips Manager
            </h2>
            <p className="text-xs text-slate-500">
              Create specimen pickup dispatches, monitor expected delivery windows, and trigger transit delay alerts
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Pickup Request
        </button>
      </div>

      {/* Trips Roster Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* If no trips exist yet, show interactive active batch from current samples */}
        {trips.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs font-bold text-blue-700">TRIP-992101</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                IN TRANSIT
              </span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-900">
              Salt Lake Sector V ➔ Central Hub
            </h3>
            <p className="text-xs text-slate-500">Runner: Rajesh Mondal • WB-04-E-1090 Cold Van</p>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Sample Count:</span>
                <span className="font-bold text-slate-800">2 Vials</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pickup Time:</span>
                <span>09:45 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Delivery:</span>
                <span className="font-semibold text-emerald-600">11:15 AM (On Track)</span>
              </div>
            </div>
          </div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-blue-700">{trip.tripCode}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                  {trip.status}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">
                {trip.centreName.split('-')[1]?.trim() || trip.centreName} ➔ Central Lab
              </h3>
              <p className="text-xs text-slate-500">
                Runner: {trip.collectorName} • {trip.vehicleNumber}
              </p>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Samples in Batch:</span>
                  <span className="font-bold text-slate-800">{trip.sampleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup:</span>
                  <span>{trip.pickupTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Arrival:</span>
                  <span className="font-semibold text-emerald-600">{trip.expectedDeliveryTime}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Logistics Pickup Dispatch</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Pickup Centre *</label>
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
                        vehicleNumber: col?.assignedVehicle || formData.vehicleNumber,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    {collectors.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.collectorId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Pickup Time</label>
                  <input
                    type="text"
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Expected Delivery</label>
                  <input
                    type="text"
                    value={formData.expectedDeliveryTime}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedDeliveryTime: e.target.value })
                    }
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
                  Dispatch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
