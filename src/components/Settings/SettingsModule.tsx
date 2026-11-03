import React, { useState } from 'react';
import { SystemSettings, UserProfile, UserRole } from '../../types';
import { saveSystemSettings } from '../../services/dbService';
import {
  Settings,
  Shield,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  Building2,
  Barcode,
  Radio,
  MessageSquare,
  Users,
} from 'lucide-react';

interface SettingsModuleProps {
  settings: SystemSettings;
  currentUser: UserProfile;
  onChangeUserRole: (role: UserRole) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  currentUser,
  onChangeUserRole,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const rolesList: { role: UserRole; desc: string; access: string }[] = [
    {
      role: 'Super Admin',
      desc: 'Complete ERP administrative control',
      access: 'All 17 modules, user management, rates & system settings',
    },
    {
      role: 'Admin',
      desc: 'Regional logistics & centre supervisor',
      access: 'Centres, collectors, GPS devices, dispatches & reports',
    },
    {
      role: 'Centre Operator',
      desc: 'Partner collection centre intake desk',
      access: 'Patient registration, sample intake, sticker printing & pickup requests',
    },
    {
      role: 'Collector',
      desc: 'Phlebotomist / courier runner in the field',
      access: 'Mobile GPS broadcast, pickup scanning, my route',
    },
    {
      role: 'Lab Receiver',
      desc: 'Central Reference Lab Inward station',
      access: 'Inward barcode scan, specimen verification, rejections & manifest',
    },
    {
      role: 'Accounts Manager',
      desc: 'Financial accountant',
      access: 'Billing statements, rate cards, payments & invoices',
    },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSystemSettings(formData, { uid: currentUser.id, name: currentUser.name });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const backup = {
      systemSettings: formData,
      exportedAt: new Date().toISOString(),
      version: '1.0.0-PROD',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `health_point_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              System Settings & Role-Based Access Control (RBAC)
            </h2>
            <p className="text-xs text-slate-500">
              Laboratory configuration, barcode/sample prefixes, GPRS server parameters and user roles
            </p>
          </div>
        </div>

        <button
          onClick={handleExportBackup}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export System JSON Backup
        </button>
      </div>

      {/* Role Switcher Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Active User Role Switcher & Permissions Matrix
            </h3>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            Current Role: {currentUser.role}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rolesList.map((item) => {
            const isActive = currentUser.role === item.role;
            return (
              <div
                key={item.role}
                onClick={() => onChangeUserRole(item.role)}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-100 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{item.role}</span>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-600">{item.desc}</p>
                <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                  Scope: {item.access}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Laboratory Profile & Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-4 w-4 text-blue-600" />
            Central Reference Laboratory Profile
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Laboratory Entity Name</label>
              <input
                type="text"
                value={formData.labName}
                onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Central Hub Address</label>
            <textarea
              rows={2}
              value={formData.labAddress}
              onChange={(e) => setFormData({ ...formData, labAddress: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Helpline Contact</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Official WhatsApp Helpline</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Prefixes & Barcodes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Barcode className="h-4 w-4 text-purple-600" />
            Identification Prefixes & Hardware Server Settings
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Sample ID Prefix</label>
              <input
                type="text"
                value={formData.sampleIdPrefix}
                onChange={(e) => setFormData({ ...formData, sampleIdPrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Centre ID Prefix</label>
              <input
                type="text"
                value={formData.centreIdPrefix}
                onChange={(e) => setFormData({ ...formData, centreIdPrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Barcode Prefix</label>
              <input
                type="text"
                value={formData.barcodePrefix}
                onChange={(e) => setFormData({ ...formData, barcodePrefix: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">GPRS Ingestion Host</label>
              <input
                type="text"
                value={formData.gpsServerHost}
                onChange={(e) => setFormData({ ...formData, gpsServerHost: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">TCP/UDP Port</label>
              <input
                type="number"
                value={formData.gpsServerPort}
                onChange={(e) =>
                  setFormData({ ...formData, gpsServerPort: parseInt(e.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Templates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            WhatsApp Templates (Variables: {'{NAME}, {SAMPLE_ID}, {TEST_NAME}, {STATUS}, {COLLECTOR}, {TIMESTAMP}'})
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700">Standard English Template</label>
            <textarea
              rows={4}
              value={formData.whatsappEnglishTemplate}
              onChange={(e) =>
                setFormData({ ...formData, whatsappEnglishTemplate: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs font-mono outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Bengali Template (বাংলা)</label>
            <textarea
              rows={4}
              value={formData.whatsappBengaliTemplate}
              onChange={(e) =>
                setFormData({ ...formData, whatsappBengaliTemplate: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs font-mono outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> System Settings Saved Successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
          >
            <Save className="h-4 w-4" />
            Save ERP Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
