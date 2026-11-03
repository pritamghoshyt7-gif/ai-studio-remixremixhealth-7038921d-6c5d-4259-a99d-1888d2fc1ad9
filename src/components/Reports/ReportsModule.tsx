import React, { useState } from 'react';
import { CollectionCentre, Collector, GpsDevice, Sample, UserProfile } from '../../types';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsModuleProps {
  samples: Sample[];
  centres: CollectionCentre[];
  collectors: Collector[];
  gpsDevices: GpsDevice[];
  currentUser: UserProfile;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  samples,
  centres,
  collectors,
  gpsDevices,
  currentUser,
}) => {
  const [reportType, setReportType] = useState<
    'DAILY_SAMPLE' | 'CENTRE_WISE' | 'COLLECTOR_WISE' | 'REJECTIONS' | 'GPS_DEVICES'
  >('DAILY_SAMPLE');

  const totalSamples = samples.length;
  const verifiedCount = samples.filter((s) => s.status === 'RECEIVED AND VERIFIED').length;
  const inTransitCount = samples.filter(
    (s) => s.status === 'IN TRANSIT' || s.status === 'PICKED UP'
  ).length;
  const rejectedCount = samples.filter((s) => s.status === 'REJECTED').length;
  const pendingCount = samples.filter(
    (s) => s.status === 'REGISTERED' || s.status === 'COLLECTED'
  ).length;

  const exportCurrentReport = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const dateStr = new Date().toISOString().slice(0, 10);

    if (reportType === 'DAILY_SAMPLE') {
      headers = ['Sample ID', 'Patient', 'Centre', 'Test', 'Specimen', 'Status', 'Date Time'];
      rows = samples.map((s) => [
        s.sampleId,
        `"${s.patientName}"`,
        `"${s.centreName}"`,
        `"${s.testName}"`,
        s.sampleType,
        s.status,
        s.collectionDateTime,
      ]);
    } else if (reportType === 'CENTRE_WISE') {
      headers = ['Centre Code', 'Centre Name', 'District', 'Total Samples', 'Status'];
      rows = centres.map((c) => {
        const count = samples.filter((s) => s.centreId === c.id).length;
        return [c.centreCode, `"${c.name}"`, c.district, count, c.status];
      });
    } else if (reportType === 'COLLECTOR_WISE') {
      headers = ['Collector ID', 'Name', 'Phone', 'Vehicle', 'Battery', 'Speed', 'Pickups Today'];
      rows = collectors.map((col) => [
        col.collectorId,
        `"${col.name}"`,
        col.mobileNumber,
        `"${col.assignedVehicle}"`,
        `${col.batteryLevel}%`,
        `${col.speedKmh} km/h`,
        col.dailyCollectionsCount || 0,
      ]);
    } else {
      headers = ['Sample ID', 'Patient', 'Centre', 'Test', 'Rejection Reason'];
      rows = samples
        .filter((s) => s.status === 'REJECTED')
        .map((s) => [
          s.sampleId,
          `"${s.patientName}"`,
          `"${s.centreName}"`,
          `"${s.testName}"`,
          `"${s.rejectionReason || 'Specimen Compromised'}"`,
        ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `health_point_report_${reportType.toLowerCase()}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Operational Intelligence & Analytics Reports
            </h2>
            <p className="text-xs text-slate-500">
              Diagnostic sample velocity, collector route efficiency, rejection quality rates & Excel export
            </p>
          </div>
        </div>

        <button
          onClick={exportCurrentReport}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export Report to CSV / Excel
        </button>
      </div>

      {/* KPI Funnel Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Total Volume</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalSamples}</div>
          <span className="text-[10px] text-slate-500">Collected specimens</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-500">In Transit</span>
          <div className="mt-1 text-2xl font-bold text-amber-600">{inTransitCount}</div>
          <span className="text-[10px] text-slate-500">En-route cold bags</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-500">Verified at Lab</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{verifiedCount}</div>
          <span className="text-[10px] text-slate-500">Inwarded manifest</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-500">Awaiting Runner</span>
          <div className="mt-1 text-2xl font-bold text-blue-600">{pendingCount}</div>
          <span className="text-[10px] text-slate-500">Ready at centres</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-500">Quality Rejections</span>
          <div className="mt-1 text-2xl font-bold text-rose-600">{rejectedCount}</div>
          <span className="text-[10px] text-slate-500">
            {totalSamples > 0 ? ((rejectedCount / totalSamples) * 100).toFixed(1) : 0}% error rate
          </span>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setReportType('DAILY_SAMPLE')}
          className={`rounded-xl px-4 py-2 transition ${
            reportType === 'DAILY_SAMPLE'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Diagnostic Sample Log
        </button>
        <button
          onClick={() => setReportType('CENTRE_WISE')}
          className={`rounded-xl px-4 py-2 transition ${
            reportType === 'CENTRE_WISE'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Centre Volume Breakdown
        </button>
        <button
          onClick={() => setReportType('COLLECTOR_WISE')}
          className={`rounded-xl px-4 py-2 transition ${
            reportType === 'COLLECTOR_WISE'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Phlebotomist Runner Performance
        </button>
        <button
          onClick={() => setReportType('REJECTIONS')}
          className={`rounded-xl px-4 py-2 transition ${
            reportType === 'REJECTIONS'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Quality Rejection Audit
        </button>
      </div>

      {/* Active Report Table Display */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          {reportType === 'DAILY_SAMPLE' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Sample ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Collection Centre</th>
                  <th className="py-3 px-4">Test Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Collection Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{s.sampleId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.patientName}</td>
                    <td className="py-3 px-4">{s.centreName}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{s.testName}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{s.status}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.collectionDateTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'CENTRE_WISE' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Centre Code</th>
                  <th className="py-3 px-4">Centre Name</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Total Samples</th>
                  <th className="py-3 px-4">In Transit</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centres.map((c) => {
                  const cSamples = samples.filter((s) => s.centreId === c.id);
                  const inTransit = cSamples.filter((s) => s.status === 'IN TRANSIT').length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{c.centreCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4">{c.district}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{cSamples.length}</td>
                      <td className="py-3 px-4 font-semibold text-amber-600">{inTransit}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{c.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'COLLECTOR_WISE' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Collector ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Assigned Vehicle</th>
                  <th className="py-3 px-4">Current Speed</th>
                  <th className="py-3 px-4">Battery</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4">Today's Pickups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collectors.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{col.collectorId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{col.name}</td>
                    <td className="py-3 px-4">{col.assignedVehicle}</td>
                    <td className="py-3 px-4 font-mono">{col.speedKmh} km/h</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{col.batteryLevel}%</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{col.status}</td>
                    <td className="py-3 px-4 font-bold text-purple-600">
                      {col.dailyCollectionsCount || 0} vials
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'REJECTIONS' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                <tr>
                  <th className="py-3 px-4">Sample ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Origin Centre</th>
                  <th className="py-3 px-4">Test</th>
                  <th className="py-3 px-4">Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.filter((s) => s.status === 'REJECTED').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No rejected samples on record. Lab quality threshold is 100%.
                    </td>
                  </tr>
                ) : (
                  samples
                    .filter((s) => s.status === 'REJECTED')
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-rose-600">{s.sampleId}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{s.patientName}</td>
                        <td className="py-3 px-4">{s.centreName}</td>
                        <td className="py-3 px-4">{s.testName}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">
                          {s.rejectionReason || 'Specimen Compromised'}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
