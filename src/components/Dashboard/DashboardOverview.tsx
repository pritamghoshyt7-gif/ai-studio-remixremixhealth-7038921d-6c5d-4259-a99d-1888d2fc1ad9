import React from 'react';
import {
  CollectionCentre,
  Collector,
  GpsDevice,
  LogisticsTrip,
  Patient,
  Sample,
  UserProfile,
} from '../../types';
import { LiveLogisticsMap } from './LiveLogisticsMap';
import {
  Building2,
  Users,
  TestTubes,
  Truck,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Send,
  Barcode,
  Sparkles,
} from 'lucide-react';

interface DashboardOverviewProps {
  centres: CollectionCentre[];
  collectors: Collector[];
  gpsDevices: GpsDevice[];
  samples: Sample[];
  patients: Patient[];
  trips: LogisticsTrip[];
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
  onSelectSampleDetail: (sample: Sample) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  centres,
  collectors,
  gpsDevices,
  samples,
  patients,
  trips,
  currentUser,
  onNavigateTab,
  onSelectSampleDetail,
}) => {
  // Metric Calculations
  const totalCentres = centres.length;
  const activeCentres = centres.filter((c) => c.status === 'ACTIVE').length;
  const totalPatients = patients.length;
  const totalSamples = samples.length;

  const pendingSamples = samples.filter(
    (s) => s.status === 'REGISTERED' || s.status === 'COLLECTED'
  ).length;
  const pickedUpSamples = samples.filter((s) => s.status === 'PICKED UP').length;
  const inTransitSamples = samples.filter((s) => s.status === 'IN TRANSIT').length;
  const receivedSamples = samples.filter((s) => s.status === 'RECEIVED AND VERIFIED').length;
  const rejectedSamples = samples.filter((s) => s.status === 'REJECTED').length;

  const activeCollectors = collectors.filter((c) => c.status === 'ON_DUTY').length;
  const onlineGps = gpsDevices.filter((d) => d.serverConnectionStatus === 'ONLINE').length;
  const offlineGps = gpsDevices.filter((d) => d.serverConnectionStatus !== 'ONLINE').length;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              Health Point ERP v2.4
            </span>
            <span className="text-xs text-blue-100">• Live Central Synchronization</span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight">
            Diagnostic Sample Logistics Operations Hub
          </h2>
          <p className="mt-1 text-xs text-blue-100 max-w-xl">
            Real-time specimen monitoring across {activeCentres} partner centres, {activeCollectors} active phlebotomists, and Central Reference Lab Kolkata.
          </p>
        </div>

        {/* Quick Operations Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('scanner')}
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-md hover:bg-blue-50 transition active:scale-95"
          >
            <Barcode className="h-4 w-4" />
            Scan Barcode
          </button>
          <button
            onClick={() => onNavigateTab('samples')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-800/80 px-4 py-2 text-xs font-bold text-white border border-blue-400/40 hover:bg-blue-900 transition active:scale-95"
          >
            <TestTubes className="h-4 w-4" />
            + New Sample
          </button>
          <button
            onClick={() => onNavigateTab('lab_receiving')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            Lab Inward Dock
          </button>
        </div>
      </div>

      {/* Module 1: Comprehensive Super Admin KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Centres */}
        <div
          onClick={() => onNavigateTab('centres')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Centres</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCentres}</div>
          <div className="mt-1 text-[11px] font-medium text-emerald-600">
            {activeCentres} Active Units
          </div>
        </div>

        {/* Total Patients */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Patients</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalPatients}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">Registered Directory</div>
        </div>

        {/* Total Samples Today */}
        <div
          onClick={() => onNavigateTab('samples')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Samples Today</span>
            <TestTubes className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{totalSamples}</div>
          <div className="mt-1 text-[11px] font-medium text-slate-500">Specimens Processed</div>
        </div>

        {/* In Transit */}
        <div
          onClick={() => onNavigateTab('tracking')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">In Transit</span>
            <Truck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {inTransitSamples + pickedUpSamples}
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-700">On The Road</div>
        </div>

        {/* Received Samples */}
        <div
          onClick={() => onNavigateTab('lab_receiving')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Verified at Lab</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{receivedSamples}</div>
          <div className="mt-1 text-[11px] font-medium text-emerald-700">Inward Manifest</div>
        </div>

        {/* Online GPS Telemetry */}
        <div
          onClick={() => onNavigateTab('gps_hardware')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-purple-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">GPS Trackers</span>
            <Radio className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{onlineGps}</div>
          <div className="mt-1 text-[11px] font-medium text-purple-600">
            {offlineGps} Standby / Offline
          </div>
        </div>
      </div>

      {/* Live Interactive Logistics Radar Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-800">
              Live Regional Sample Logistics Map (West Bengal / Kolkata Central Hub)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('tracking')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Open Full Screen Radar <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <LiveLogisticsMap
          centres={centres}
          collectors={collectors}
          gpsDevices={gpsDevices}
          onSelectCentre={() => onNavigateTab('centres')}
          onSelectCollector={() => onNavigateTab('tracking')}
        />
      </div>

      {/* Two Columns: Pipeline Velocity & Today's Dispatches Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Specimen Chain-of-Custody Funnel (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-blue-600" />
              Specimen Chain-of-Custody Flow Pipeline
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-medium">
              <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100">
                <span className="text-slate-500 text-[11px]">1. Registered</span>
                <div className="text-lg font-bold text-blue-700 mt-1">
                  {samples.filter((s) => s.status === 'REGISTERED').length}
                </div>
                <div className="text-[10px] text-slate-400">At centre desk</div>
              </div>

              <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-100">
                <span className="text-amber-700 text-[11px]">2. Collected</span>
                <div className="text-lg font-bold text-amber-700 mt-1">
                  {samples.filter((s) => s.status === 'COLLECTED').length}
                </div>
                <div className="text-[10px] text-slate-400">Ready in vial rack</div>
              </div>

              <div className="rounded-xl bg-indigo-50/70 p-3 border border-indigo-100">
                <span className="text-indigo-700 text-[11px]">3. In Transit</span>
                <div className="text-lg font-bold text-indigo-700 mt-1">
                  {inTransitSamples + pickedUpSamples}
                </div>
                <div className="text-[10px] text-slate-400">Cold chain courier</div>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                <span className="text-emerald-700 text-[11px]">4. Verified at Lab</span>
                <div className="text-lg font-bold text-emerald-700 mt-1">{receivedSamples}</div>
                <div className="text-[10px] text-slate-400">Cleared for testing</div>
              </div>
            </div>

            {/* Quality Warning if Rejections exist */}
            {rejectedSamples > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>{rejectedSamples} Rejected Samples:</strong> Specimens reported
                    hemolysed, clotted, or insufficient volume at lab receiving.
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab('lab_receiving')}
                  className="font-bold underline text-rose-900"
                >
                  Review Dock
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Movement Feed (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Live Logistics Movements
              </h3>
              <button
                onClick={() => onNavigateTab('samples')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {samples.slice(0, 5).map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => onSelectSampleDetail(sample)}
                  className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:border-blue-300 hover:bg-blue-50/30 transition text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">{sample.sampleId}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        sample.status === 'RECEIVED AND VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sample.status === 'IN TRANSIT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sample.status}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-800">{sample.patientName}</div>
                  <div className="mt-0.5 flex justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[180px]">{sample.testName}</span>
                    <span className="text-slate-400">
                      {new Date(sample.collectionDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
