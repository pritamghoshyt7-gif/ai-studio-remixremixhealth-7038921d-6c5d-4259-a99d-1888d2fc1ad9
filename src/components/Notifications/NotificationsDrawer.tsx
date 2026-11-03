import React from 'react';
import { Sample, CollectionCentre, Collector, GpsDevice } from '../../types';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  samples: Sample[];
  centres: CollectionCentre[];
  collectors: Collector[];
  gpsDevices: GpsDevice[];
  onNavigateTab: (tab: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  samples,
  centres,
  collectors,
  gpsDevices,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  // Build notifications feed dynamically from real operational state
  const notifications = [
    ...samples
      .filter((s) => s.status === 'REJECTED')
      .map((s) => ({
        id: `notif-rej-${s.id}`,
        type: 'ERROR' as const,
        title: `Specimen Rejected: ${s.sampleId}`,
        message: `${s.patientName} (${s.testName}) at ${s.centreName}: ${s.rejectionReason || 'Specimen damaged'}`,
        timestamp: 'Requires Immediate Recollect',
        targetTab: 'lab_receiving',
      })),
    ...samples
      .filter((s) => s.status === 'COLLECTED' || s.status === 'PICKUP REQUESTED')
      .slice(0, 3)
      .map((s) => ({
        id: `notif-pick-${s.id}`,
        type: 'WARNING' as const,
        title: `Pending Pickup at ${s.centreName.split('-')[1]?.trim() || s.centreName}`,
        message: `Sample ${s.sampleId} (${s.testName}) ready for phlebotomist runner`,
        timestamp: 'Waiting for Courier',
        targetTab: 'logistics',
      })),
    ...gpsDevices
      .filter((d) => d.serverConnectionStatus !== 'ONLINE')
      .map((d) => ({
        id: `notif-gps-${d.id}`,
        type: 'INFO' as const,
        title: `GPS Tracker Standby: ${d.deviceName}`,
        message: `Unit IMEI ${d.imei} on ${d.vehicleNumber} is currently parked or in docking mode`,
        timestamp: 'Telemetry Standby',
        targetTab: 'gps_hardware',
      })),
    {
      id: 'notif-cent-1',
      type: 'SUCCESS' as const,
      title: 'Partner Centre Online: Salt Lake Sector V',
      message: 'Active and accepting patients with 15% partner rate tier enabled',
      timestamp: 'Today 07:00 AM',
      targetTab: 'centres',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="h-full w-full max-w-md bg-white p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Logistics Alert Center</h3>
              <p className="text-xs text-slate-500">Live operational dispatches and quality events</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onNavigateTab(n.targetTab);
                onClose();
              }}
              className={`cursor-pointer rounded-2xl border p-3.5 transition hover:shadow-sm ${
                n.type === 'ERROR'
                  ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                  : n.type === 'WARNING'
                  ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                  : n.type === 'SUCCESS'
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-xs text-slate-900">{n.title}</span>
                <span className="text-[10px] text-slate-400 font-medium">{n.timestamp}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
              <div className="mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold text-blue-600">
                View Details <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Dismiss All
          </button>
        </div>
      </div>
    </div>
  );
};
