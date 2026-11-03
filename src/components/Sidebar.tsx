import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Users,
  TestTubes,
  Barcode,
  Navigation,
  Cpu,
  MessageSquare,
  Truck,
  Send,
  PackageCheck,
  CreditCard,
  BarChart3,
  Settings,
  Smartphone,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  sampleCount: number;
  inTransitCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  sampleCount,
  inTransitCount,
}) => {
  const navSections = [
    {
      title: 'EXECUTIVE & REAL-TIME',
      items: [
        { id: 'dashboard', label: 'Super Admin Dashboard', icon: LayoutDashboard },
        { id: 'map', label: 'Live Logistics Map', icon: Navigation, badge: `${inTransitCount} live` },
      ],
    },
    {
      title: 'CENTRE & SPECIMEN INTAKE',
      items: [
        { id: 'centres', label: 'Collection Centres', icon: Building2 },
        { id: 'patients', label: 'Patient Directory', icon: Users },
        { id: 'samples', label: 'Diagnostic Samples', icon: TestTubes, badge: `${sampleCount}` },
        { id: 'scanner', label: 'QR & Barcode Scanner', icon: Barcode },
      ],
    },
    {
      title: 'FLEET & HARDWARE LOGISTICS',
      items: [
        { id: 'tracking', label: 'Mobile Collector GPS', icon: MapPin },
        { id: 'gps_hardware', label: 'GPRS GPS Devices', icon: Cpu },
        { id: 'collectors', label: 'Phlebotomists & Fleet', icon: Truck },
        { id: 'logistics', label: 'Transit Dispatches', icon: Send },
      ],
    },
    {
      title: 'CENTRAL LABORATORY',
      items: [
        { id: 'lab_receiving', label: 'Lab Inward Dock', icon: PackageCheck },
      ],
    },
    {
      title: 'COMMUNICATIONS & FINANCE',
      items: [
        { id: 'whatsapp', label: 'WhatsApp Notifications', icon: MessageSquare },
        { id: 'billing', label: 'B2B Accounts & Rates', icon: CreditCard },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM & DEPLOYMENT',
      items: [
        { id: 'settings', label: 'System Settings & RBAC', icon: Settings },
        { id: 'platforms', label: 'Android & Windows Apps', icon: Smartphone },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Brand header on mobile sidebar */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              HP
            </div>
            <span className="font-bold text-sm text-slate-900">Health Point ERP</span>
          </div>
          <button onClick={onCloseMobile} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {/* Nav Sections Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isActive
                              ? 'bg-blue-700 text-blue-100'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer info */}
        <div className="border-t border-slate-100 p-3.5 bg-slate-50/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Kolkata Central Lab Cloud</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Emergency Desk: +91 33 2234 5678
          </div>
        </div>
      </aside>
    </>
  );
};
