import React, { useState } from 'react';
import { Smartphone, Monitor, Download, Terminal, CheckCircle2, Shield, Layers, Copy } from 'lucide-react';

export const PlatformsModule: React.FC = () => {
  const [activeClient, setActiveClient] = useState<'ANDROID' | 'WINDOWS'>('ANDROID');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const androidCapacitorConfig = `{
  "appId": "com.healthpoint.logistics.erp",
  "appName": "Health Point Logistics",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "url": "${window.location.origin}",
    "cleartext": true
  },
  "plugins": {
    "Geolocation": {
      "permissions": ["location", "coarseLocation"]
    },
    "Camera": {
      "permissions": ["camera"]
    }
  }
}`;

  const electronMainScript = `// Health Point Windows Desktop EXE Wrapper (Electron)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "Health Point - Diagnostic Sample Logistics ERP",
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Connects directly to central cloud instance
  win.loadURL('${window.location.origin}');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Cross-Platform Deployment & Native App Client Hub
            </h2>
            <p className="text-xs text-slate-500">
              Unified multi-client architecture connecting Android Mobile APK and Windows Desktop EXE to Central Health Point Hub
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveClient('ANDROID')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
              activeClient === 'ANDROID'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Android Mobile App
          </button>
          <button
            onClick={() => setActiveClient('WINDOWS')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
              activeClient === 'WINDOWS'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="h-4 w-4" />
            Windows Desktop EXE
          </button>
        </div>
      </div>

      {activeClient === 'ANDROID' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                Android Field Phlebotomist Client (Capacitor / Jetpack Compose)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Tailored for mobile collectors with continuous background geolocation streaming, offline sample queuing, and camera barcode scanning.
              </p>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Android Permissions Configured
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li><code className="text-blue-600 font-bold">ACCESS_FINE_LOCATION</code>: Real-time high-accuracy collector coordinates</li>
                    <li><code className="text-blue-600 font-bold">ACCESS_BACKGROUND_LOCATION</code>: Continuous route logging during screen sleep</li>
                    <li><code className="text-blue-600 font-bold">CAMERA</code>: Instant Code 128 / QR scanning at collection points</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-900 p-4 text-emerald-400 font-mono">
                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2 mb-2">
                    <span>capacitor.config.json</span>
                    <button
                      onClick={() => copyToClipboard(androidCapacitorConfig, 'cap')}
                      className="text-xs text-blue-400 hover:text-white"
                    >
                      {copiedKey === 'cap' ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="text-[11px] overflow-x-auto">{androidCapacitorConfig}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-2">Android Build Commands</h4>
              <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-700 font-bold"># 1. Install Capacitor CLI</p>
                <p className="text-slate-500">npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                <p className="text-slate-700 font-bold mt-2"># 2. Add Android Target</p>
                <p className="text-slate-500">npx cap add android</p>
                <p className="text-slate-700 font-bold mt-2"># 3. Build & Generate APK</p>
                <p className="text-slate-500">npm run build && npx cap copy && npx cap open android</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeClient === 'WINDOWS' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Windows Desktop Application (Electron EXE)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Designed for Reception and Central Lab Desks with direct COM port laser barcode scanner input and thermal sticker printing.
              </p>

              <div className="rounded-xl bg-slate-900 p-4 text-emerald-400 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2 mb-2">
                  <span>electron-main.cjs</span>
                  <button
                    onClick={() => copyToClipboard(electronMainScript, 'elec')}
                    className="text-xs text-blue-400 hover:text-white"
                  >
                    {copiedKey === 'elec' ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <pre className="text-[11px] overflow-x-auto">{electronMainScript}</pre>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-2">Windows EXE Build Commands</h4>
              <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-700 font-bold"># 1. Install Electron Packager</p>
                <p className="text-slate-500">npm install -D electron electron-builder</p>
                <p className="text-slate-700 font-bold mt-2"># 2. Package Windows Installer</p>
                <p className="text-slate-500">npx electron-builder --win --x64</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
