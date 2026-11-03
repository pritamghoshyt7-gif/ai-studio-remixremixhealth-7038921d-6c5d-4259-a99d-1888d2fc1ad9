import React, { useState } from 'react';
import { CollectionCentre, Collector, GpsDevice } from '../../types';
import {
  MapPin,
  Navigation,
  Crosshair,
  Truck,
  Building2,
  ExternalLink,
  Layers,
  Battery,
  Zap,
} from 'lucide-react';

interface LiveLogisticsMapProps {
  centres: CollectionCentre[];
  collectors: Collector[];
  gpsDevices: GpsDevice[];
  onSelectCollector?: (collector: Collector) => void;
  onSelectCentre?: (centre: CollectionCentre) => void;
}

export const LiveLogisticsMap: React.FC<LiveLogisticsMapProps> = ({
  centres,
  collectors,
  gpsDevices,
  onSelectCollector,
  onSelectCentre,
}) => {
  const [selectedPin, setSelectedPin] = useState<{
    type: 'LAB' | 'CENTRE' | 'COLLECTOR';
    data: any;
  } | null>(null);
  const [mapMode, setMapMode] = useState<'RADAR' | 'SATELLITE'>('RADAR');

  // Central Reference Lab coordinates
  const CENTRAL_LAB = {
    name: 'Health Point Central Reference Lab & Processing Hub',
    lat: 22.5726,
    lng: 88.3639,
    address: '42/B Central Avenue, Kolkata 700012',
    type: 'Central Lab',
  };

  // Coordinates bounding box for West Bengal / Kolkata Hub
  // Min Lat: 22.40, Max Lat: 22.80, Min Lng: 88.25, Max Lng: 88.55
  const minLat = 22.42;
  const maxLat = 22.75;
  const minLng = 88.28;
  const maxLng = 88.52;

  // Project lat/lng to SVG percentage (0% to 100%)
  const projectCoords = (lat: number, lng: number) => {
    // If Siliguri (north WB), clamp gently for visual representation on Kolkata regional radar
    const boundedLat = Math.min(Math.max(lat, 22.44), 22.74);
    const boundedLng = Math.min(Math.max(lng, 88.30), 88.50);

    const x = ((boundedLng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((boundedLat - minLat) / (maxLat - minLat)) * 100;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  };

  const labCoords = projectCoords(CENTRAL_LAB.lat, CENTRAL_LAB.lng);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-xl">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/80 p-3 backdrop-blur-md border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </div>
          <span className="font-semibold text-slate-200">Live Logistics Telemetry</span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-300">
            {collectors.filter((c) => c.status === 'ON_DUTY').length} Active Runners
          </span>
          <span className="hidden sm:inline text-slate-300">
            • {centres.length} Collection Points
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Layer Toggle */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setMapMode('RADAR')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                mapMode === 'RADAR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Radar Vector
            </button>
            <button
              onClick={() => setMapMode('SATELLITE')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                mapMode === 'SATELLITE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Dark Satellite
            </button>
          </div>

          {/* External Google Maps Button */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${CENTRAL_LAB.lat},${CENTRAL_LAB.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Open in</span> Google Maps
          </a>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div
        className={`relative h-[480px] w-full transition-colors duration-500 ${
          mapMode === 'RADAR'
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950'
            : 'bg-gradient-to-br from-gray-950 via-stone-900 to-neutral-950'
        }`}
      >
        {/* Radar grid lines */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <svg className="h-full w-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Concentric distance rings around Central Lab */}
            <circle
              cx={`${labCoords.x}%`}
              cy={`${labCoords.y}%`}
              r="60"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <circle
              cx={`${labCoords.x}%`}
              cy={`${labCoords.y}%`}
              r="130"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <circle
              cx={`${labCoords.x}%`}
              cy={`${labCoords.y}%`}
              r="220"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </svg>
        </div>

        {/* Transit Routes (Connecting Centres to Central Lab) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {centres.map((centre) => {
            const pos = projectCoords(centre.latitude, centre.longitude);
            return (
              <g key={`route-${centre.id}`}>
                <line
                  x1={`${pos.x}%`}
                  y1={`${pos.y}%`}
                  x2={`${labCoords.x}%`}
                  y2={`${labCoords.y}%`}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  opacity="0.35"
                />
              </g>
            );
          })}
        </svg>

        {/* Central Reference Lab Hub Pin */}
        <div
          style={{ left: `${labCoords.x}%`, top: `${labCoords.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
          onClick={() => setSelectedPin({ type: 'LAB', data: CENTRAL_LAB })}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute h-10 w-10 animate-ping rounded-full bg-blue-500/40"></span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg ring-4 ring-blue-400/30">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="absolute top-11 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/40 shadow-md">
              CENTRAL LAB HUB
            </div>
          </div>
        </div>

        {/* Collection Centres Pins */}
        {centres.map((centre) => {
          const pos = projectCoords(centre.latitude, centre.longitude);
          return (
            <div
              key={centre.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
              onClick={() => {
                setSelectedPin({ type: 'CENTRE', data: centre });
                onSelectCentre?.(centre);
              }}
            >
              <div className="relative flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/90 shadow-md ring-2 ring-emerald-400/40 hover:scale-110 transition-transform">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="mt-1 whitespace-nowrap rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-700 shadow-sm">
                  {centre.centreCode}
                </div>
              </div>
            </div>
          );
        })}

        {/* Field Collectors on Routes with Pulses */}
        {collectors.map((collector) => {
          const pos = projectCoords(collector.currentLatitude, collector.currentLongitude);
          const isOnDuty = collector.status === 'ON_DUTY';
          return (
            <div
              key={collector.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer group"
              onClick={() => {
                setSelectedPin({ type: 'COLLECTOR', data: collector });
                onSelectCollector?.(collector);
              }}
            >
              <div className="relative flex flex-col items-center">
                {isOnDuty && (
                  <span className="absolute h-8 w-8 animate-ping rounded-full bg-amber-400/40"></span>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-lg ring-3 ring-amber-300/40 hover:scale-110 transition-transform">
                  <Truck className="h-4 w-4 text-slate-950" />
                </div>
                <div className="mt-1 flex items-center gap-1 rounded bg-slate-900/95 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30 shadow-md">
                  <span>{collector.collectorId}</span>
                  {collector.speedKmh ? (
                    <span className="text-[8px] text-slate-400">({collector.speedKmh} km/h)</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Element Telemetry Card Modal / Drawer */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 right-4 z-40 max-w-md rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  selectedPin.type === 'LAB'
                    ? 'bg-blue-600 text-white'
                    : selectedPin.type === 'CENTRE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {selectedPin.type === 'LAB' ? (
                  <Building2 className="h-5 w-5" />
                ) : selectedPin.type === 'CENTRE' ? (
                  <MapPin className="h-5 w-5" />
                ) : (
                  <Truck className="h-5 w-5" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {selectedPin.type === 'LAB'
                    ? selectedPin.data.name
                    : selectedPin.type === 'CENTRE'
                    ? selectedPin.data.name
                    : `${selectedPin.data.name} (${selectedPin.data.collectorId})`}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedPin.type === 'LAB'
                    ? selectedPin.data.address
                    : selectedPin.type === 'CENTRE'
                    ? `${selectedPin.data.district}, ${selectedPin.data.state} • ${selectedPin.data.centreCode}`
                    : `Vehicle: ${selectedPin.data.assignedVehicle} • Duty: ${selectedPin.data.status}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          {selectedPin.type === 'COLLECTOR' && (
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-800/80 p-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>{selectedPin.data.speedKmh || 0} km/h</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Battery className="h-3.5 w-3.5 text-emerald-400" />
                <span>{selectedPin.data.batteryLevel || 85}%</span>
              </div>
              <div className="text-right text-slate-400">
                {selectedPin.data.dailyCollectionsCount || 0} pickups today
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
            <span className="text-slate-400">
              GPS: {selectedPin.data.latitude || selectedPin.data.lat},{' '}
              {selectedPin.data.longitude || selectedPin.data.lng}
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${
                selectedPin.data.latitude || selectedPin.data.lat
              },${selectedPin.data.longitude || selectedPin.data.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300"
            >
              <Navigation className="h-3.5 w-3.5" />
              Navigate
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
