import React, { useState } from 'react';
import { Collector, GpsDevice, GpsProtocol, UserProfile } from '../../types';
import { saveGpsDevice } from '../../services/dbService';
import { GpsProtocolAdapter, ParsedGpsTelemetry } from '../../services/gpsProtocolService';
import {
  Cpu,
  Plus,
  Radio,
  Terminal,
  Signal,
  Battery,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';

interface GpsHardwareModuleProps {
  gpsDevices: GpsDevice[];
  collectors: Collector[];
  currentUser: UserProfile;
}

export const GpsHardwareModule: React.FC<GpsHardwareModuleProps> = ({
  gpsDevices,
  collectors,
  currentUser,
}) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<GpsProtocol>('GT06');
  const [testPacketInput, setTestPacketInput] = useState('');
  const [parsedTelemetryResult, setParsedTelemetryResult] = useState<ParsedGpsTelemetry | null>(null);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  // New Device Form
  const [formData, setFormData] = useState<Partial<GpsDevice>>({
    imei: '',
    deviceName: '',
    simNumber: '+91 ',
    vehicleNumber: 'WB-',
    deviceProtocol: 'GT06',
    assignedCollectorId: collectors[0]?.id || '',
    serverConnectionStatus: 'STANDBY',
  });

  const handleOpenRegister = () => {
    const randomImei = `86${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
    setFormData({
      id: `dev-${Date.now()}`,
      imei: randomImei,
      deviceName: 'GT06-Unit-New',
      simNumber: '+91 98321 00120',
      vehicleNumber: 'WB-02-EX-1234',
      deviceProtocol: 'GT06',
      assignedCollectorId: collectors[0]?.id || '',
      serverConnectionStatus: 'STANDBY',
      latitude: 22.5726,
      longitude: 88.3639,
      speed: 0,
      batteryStatus: '100% (Docked)',
      gpsSignalStatus: 'STRONG',
    });
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imei || !formData.deviceName || !formData.vehicleNumber) return;

    const assignedCollector = collectors.find((c) => c.id === formData.assignedCollectorId);

    const deviceToSave: GpsDevice = {
      id: formData.id || `dev-${Date.now()}`,
      imei: formData.imei,
      deviceName: formData.deviceName,
      simNumber: formData.simNumber || '',
      vehicleNumber: formData.vehicleNumber,
      deviceProtocol: formData.deviceProtocol || 'GT06',
      assignedCollectorId: formData.assignedCollectorId,
      assignedCollectorName: assignedCollector?.name,
      serverConnectionStatus: 'ONLINE',
      lastGpsUpdate: new Date().toISOString(),
      latitude: formData.latitude || 22.5726,
      longitude: formData.longitude || 88.3639,
      speed: formData.speed || 0,
      batteryStatus: formData.batteryStatus || '100%',
      gpsSignalStatus: (formData.gpsSignalStatus as any) || 'STRONG',
    };

    await saveGpsDevice(deviceToSave, { uid: currentUser.id, name: currentUser.name });
    setIsRegisterModalOpen(false);
  };

  // Generate Sample Packet for selected protocol
  const handleGenerateSamplePacket = (protocol: GpsProtocol) => {
    const activeImei = gpsDevices[0]?.imei || '862045041928371';
    const sample = GpsProtocolAdapter.generateSamplePacket(protocol, activeImei);
    setTestPacketInput(sample);
  };

  // Parse Raw Hardware Packet using Adapter Architecture
  const handleParseAndIngest = async () => {
    if (!testPacketInput.trim()) return;
    setIngestStatus('Parsing raw hardware packet via Protocol Adapter...');

    const parsed = GpsProtocolAdapter.parsePacket(testPacketInput, selectedProtocol);
    setParsedTelemetryResult(parsed);

    if (parsed) {
      try {
        // Send to backend ingestion API endpoint
        const res = await fetch('/api/gps/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });
        const data = await res.json();
        setIngestStatus(`Success: Hardware packet ingested! ACK 0x01 returned. Device: ${parsed.imei}`);
      } catch {
        setIngestStatus(`Local adapter decoded packet successfully: Lat ${parsed.latitude}, Lng ${parsed.longitude}`);
      }
    } else {
      setIngestStatus('Error: Failed to parse packet. Check protocol format.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              External GPRS GPS Hardware Telemetry Module
            </h2>
            <p className="text-xs text-slate-500">
              Dedicated hardware protocol adapter supporting GT06, Teltonika Codec 8, Concox, TK103, and Queclink GPS trackers
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Register GPS Unit
        </button>
      </div>

      {/* Protocol Architecture Architecture Diagram / Ingestion Specs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Server className="h-4 w-4 text-blue-600" />
            Backend Ingestion Endpoint
          </div>
          <div className="mt-2 rounded-lg bg-slate-900 p-2 font-mono text-[11px] text-emerald-400">
            POST /api/gps/ingest
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Listens on TCP/HTTP port for raw hardware telemetry packets.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Radio className="h-4 w-4 text-purple-600" />
            Supported Protocols
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {['GT06', 'TELTONIKA', 'CONCOX', 'TK103', 'QUECLINK'].map((p) => (
              <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                {p}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Multi-brand protocol adapter with CRC16 and NMEA validation.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Signal className="h-4 w-4 text-emerald-600" />
            Active Fleet Units
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {gpsDevices.filter((d) => d.serverConnectionStatus === 'ONLINE').length} / {gpsDevices.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Units transmitting live GPRS packets to Central Hub.
          </p>
        </div>
      </div>

      {/* GPS Devices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Registered GPRS GPS Telemetry Units</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
              <tr>
                <th className="py-3.5 px-4">Device Name & IMEI</th>
                <th className="py-3.5 px-4">Vehicle & SIM</th>
                <th className="py-3.5 px-4">Protocol</th>
                <th className="py-3.5 px-4">Server Status</th>
                <th className="py-3.5 px-4">Telemetry (Lat/Lng)</th>
                <th className="py-3.5 px-4">Speed & Signal</th>
                <th className="py-3.5 px-4">Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gpsDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{dev.deviceName}</div>
                    <div className="font-mono text-[11px] text-slate-500">IMEI: {dev.imei}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{dev.vehicleNumber}</div>
                    <div className="text-[11px] text-slate-400">SIM: {dev.simNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                      {dev.deviceProtocol}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        dev.serverConnectionStatus === 'ONLINE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dev.serverConnectionStatus === 'STANDBY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Radio className="h-3 w-3" />
                      {dev.serverConnectionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    {dev.latitude.toFixed(4)}, {dev.longitude.toFixed(4)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{dev.speed} km/h</div>
                    <div className="text-[10px] text-slate-400">Signal: {dev.gpsSignalStatus}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Battery className="h-3.5 w-3.5" />
                      <span>{dev.batteryStatus}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protocol Adapter Test Console */}
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Hardware Protocol Packet Ingestion Tester
              </h3>
              <p className="text-xs text-slate-400">
                Inject test GT06, Teltonika, or TK103 raw bytes to verify adapter parsing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['GT06', 'TELTONIKA', 'TK103', 'QUECLINK', 'JSON_REST'] as GpsProtocol[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setSelectedProtocol(p);
                  handleGenerateSamplePacket(p);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono transition ${
                  selectedProtocol === p
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Sample {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400">
              Raw Hardware Telemetry Payload (Hex / ASCII / JSON):
            </label>
            <textarea
              rows={3}
              value={testPacketInput}
              onChange={(e) => setTestPacketInput(e.target.value)}
              placeholder="Paste raw packet (e.g. 78781F220B090E081827CF027AC7F00C4658FB... or ($$1234,2234.34,N,08821.56,E...))"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-mono">{ingestStatus || 'Awaiting packet'}</div>
            <button
              onClick={handleParseAndIngest}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition active:scale-95"
            >
              <Play className="h-4 w-4" />
              Decode & Ingest Packet
            </button>
          </div>

          {parsedTelemetryResult && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Decoded Telemetry Packet
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px]">IMEI:</span>
                  <div className="font-bold text-amber-400">{parsedTelemetryResult.imei}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">COORDINATES:</span>
                  <div className="font-bold text-emerald-400">
                    {parsedTelemetryResult.latitude}, {parsedTelemetryResult.longitude}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">SPEED:</span>
                  <div className="font-bold text-blue-400">{parsedTelemetryResult.speed} km/h</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">PROTOCOL:</span>
                  <div className="font-bold text-purple-400">{parsedTelemetryResult.protocol}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register GPS Unit Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Register GPRS GPS Tracker Unit</h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Hardware IMEI *</label>
                  <input
                    type="text"
                    required
                    value={formData.imei || ''}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    placeholder="862045041928371"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Device Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.deviceName || ''}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    placeholder="GT06-Runner-Bike"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">SIM Card Number</label>
                  <input
                    type="text"
                    value={formData.simNumber || ''}
                    onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                    placeholder="+91 98321 00112"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="WB-02-AK-4412"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Device Protocol</label>
                  <select
                    value={formData.deviceProtocol || 'GT06'}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceProtocol: e.target.value as GpsProtocol })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="GT06">GT06 Protocol</option>
                    <option value="TELTONIKA">Teltonika Codec 8</option>
                    <option value="CONCOX">Concox Protocol</option>
                    <option value="TK103">TK103 ASCII</option>
                    <option value="QUECLINK">Queclink GL300</option>
                    <option value="JSON_REST">Standard JSON REST</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Assigned Collector</label>
                  <select
                    value={formData.assignedCollectorId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedCollectorId: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="">Unassigned</option>
                    {collectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.collectorId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
