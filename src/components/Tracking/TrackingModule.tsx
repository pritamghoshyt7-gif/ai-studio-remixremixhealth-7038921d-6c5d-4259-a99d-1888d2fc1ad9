import React, { useState, useEffect } from 'react';
import { CollectionCentre, Collector, GpsDevice } from '../../types';
import { updateCollectorLocation } from '../../services/dbService';
import {
  Navigation,
  MapPin,
  Truck,
  Phone,
  Battery,
  Zap,
  Radio,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ExternalLink,
} from 'lucide-react';

interface TrackingModuleProps {
  collectors: Collector[];
  centres: CollectionCentre[];
  gpsDevices: GpsDevice[];
}

export const TrackingModule: React.FC<TrackingModuleProps> = ({
  collectors,
  centres,
  gpsDevices,
}) => {
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(
    collectors[0] || null
  );
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [liveWatchId, setLiveWatchId] = useState<number | null>(null);
  const [currentDeviceCoords, setCurrentDeviceCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Central Reference Lab coordinates
  const LAB_COORDS = { lat: 22.5726, lng: 88.3639, name: 'Central Reference Lab, Kolkata' };

  // Calculate distance in km between two lat/lng coordinates (Haversine Formula)
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  // Toggle Live Mobile Device GPS Broadcasting via HTML5 Geolocation
  const toggleGpsBroadcast = () => {
    if (isBroadcastingGps) {
      if (liveWatchId !== null) {
        navigator.geolocation.clearWatch(liveWatchId);
        setLiveWatchId(null);
      }
      setIsBroadcastingGps(false);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoError(null);
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        setCurrentDeviceCoords({
          lat: latitude,
          lng: longitude,
          accuracy,
          speed: speed ? Math.round(speed * 3.6) : 0,
        });

        // If a collector is selected or current user is collector, update Firestore live position
        if (selectedCollector) {
          await updateCollectorLocation(
            selectedCollector.id,
            latitude,
            longitude,
            speed ? Math.round(speed * 3.6) : 25,
            90
          );
        }
        setIsBroadcastingGps(true);
      },
      (err) => {
        setGeoError(`Location access error: ${err.message}. Please allow GPS permission in browser.`);
        setIsBroadcastingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setLiveWatchId(id);
  };

  useEffect(() => {
    return () => {
      if (liveWatchId !== null) {
        navigator.geolocation.clearWatch(liveWatchId);
      }
    };
  }, [liveWatchId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Navigation className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Mobile Field Collector GPS Live Tracking
            </h2>
            <p className="text-xs text-slate-500">
              Real-time phlebotomist geolocation, route telemetry, distance to Central Lab & battery health
            </p>
          </div>
        </div>

        {/* Live Broadcast Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleGpsBroadcast}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition active:scale-95 ${
              isBroadcastingGps
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isBroadcastingGps ? (
              <>
                <Square className="h-4 w-4" /> Stop Live GPS Stream
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Field GPS Broadcast
              </>
            )}
          </button>
        </div>
      </div>

      {geoError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {isBroadcastingGps && currentDeviceCoords && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span className="font-semibold">Live GPS Active:</span>
            <span>
              Lat: {currentDeviceCoords.lat.toFixed(5)}, Lng:{' '}
              {currentDeviceCoords.lng.toFixed(5)} (±{Math.round(currentDeviceCoords.accuracy)}m)
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-700">
            {currentDeviceCoords.speed} km/h
          </span>
        </div>
      )}

      {/* Grid: Collector Roster + Selected Telemetry Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Collector Roster (5 cols) */}
        <div className="space-y-3 lg:col-span-5">
          <h3 className="text-sm font-bold text-slate-800">Field Phlebotomists & Runners</h3>
          {collectors.map((collector) => {
            const isSelected = selectedCollector?.id === collector.id;
            const distanceToLab = calculateDistanceKm(
              collector.currentLatitude,
              collector.currentLongitude,
              LAB_COORDS.lat,
              LAB_COORDS.lng
            );

            return (
              <div
                key={collector.id}
                onClick={() => setSelectedCollector(collector)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/30 shadow-md ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400 font-bold">
                        <Truck className="h-5 w-5" />
                      </div>
                      {collector.isOnline && (
                        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{collector.name}</h4>
                      <p className="text-xs text-slate-500">
                        ID: {collector.collectorId} • {collector.assignedVehicle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      collector.status === 'ON_DUTY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {collector.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span>{collector.speedKmh || 0} km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Battery className="h-3 w-3 text-emerald-500" />
                    <span>{collector.batteryLevel || 85}%</span>
                  </div>
                  <div className="text-right font-semibold text-blue-600">
                    {distanceToLab} km to Lab
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Telemetry View & Route Details (7 cols) */}
        {selectedCollector ? (
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600">
                    {selectedCollector.collectorId} • {selectedCollector.employeeId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCollector.name}</h3>
                  <p className="text-xs text-slate-500">
                    Vehicle: {selectedCollector.assignedVehicle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedCollector.mobileNumber}`}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${selectedCollector.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Coordinates & Telemetry Cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-400">Current Speed</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedCollector.speedKmh || 0} km/h
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-400">Battery Level</span>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">
                    {selectedCollector.batteryLevel || 85}%
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-400">Distance to Hub</span>
                  <div className="text-base font-bold text-blue-600 mt-0.5">
                    {calculateDistanceKm(
                      selectedCollector.currentLatitude,
                      selectedCollector.currentLongitude,
                      LAB_COORDS.lat,
                      LAB_COORDS.lng
                    )}{' '}
                    km
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-400">Today's Pickups</span>
                  <div className="text-base font-bold text-purple-600 mt-0.5">
                    {selectedCollector.dailyCollectionsCount || 12} vials
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Active Transit Route
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="font-bold text-slate-800">Current Position</div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        {selectedCollector.currentLatitude.toFixed(4)},{' '}
                        {selectedCollector.currentLongitude.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400">━━━━━▶</div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="font-bold text-slate-800">Destination Hub</div>
                      <div className="text-slate-500 text-[11px]">Central Reference Lab</div>
                    </div>
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCollector.currentLatitude},${selectedCollector.currentLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  <Navigation className="h-4 w-4" />
                  Open Live Route on Google Maps
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-slate-400 lg:col-span-7">
            Select a field phlebotomist to view live telemetry
          </div>
        )}
      </div>
    </div>
  );
};
