/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './firebase';
import {
  CollectionCentre,
  Collector,
  GpsDevice,
  LogisticsTrip,
  Patient,
  Sample,
  SystemSettings,
  UserProfile,
  UserRole,
} from './types';
import {
  INITIAL_CENTRES,
  INITIAL_COLLECTORS,
  INITIAL_GPS_DEVICES,
  INITIAL_PATIENTS,
  INITIAL_SAMPLES,
  INITIAL_SETTINGS,
} from './services/seedData';
import { seedInitialDatabaseIfEmpty } from './services/dbService';

// Layout & Modules
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { LiveLogisticsMap } from './components/Dashboard/LiveLogisticsMap';
import { CentresModule } from './components/Centres/CentresModule';
import { PatientsModule } from './components/Patients/PatientsModule';
import { SamplesModule } from './components/Samples/SamplesModule';
import { ScannerModule } from './components/Scanner/ScannerModule';
import { TrackingModule } from './components/Tracking/TrackingModule';
import { GpsHardwareModule } from './components/GpsHardware/GpsHardwareModule';
import { WhatsAppModule } from './components/WhatsApp/WhatsAppModule';
import { CollectorsModule } from './components/Collectors/CollectorsModule';
import { LogisticsModule } from './components/Logistics/LogisticsModule';
import { LabReceivingModule } from './components/LabReceiving/LabReceivingModule';
import { BillingModule } from './components/Billing/BillingModule';
import { ReportsModule } from './components/Reports/ReportsModule';
import { SettingsModule } from './components/Settings/SettingsModule';
import { PlatformsModule } from './components/Platforms/PlatformsModule';
import { NotificationsDrawer } from './components/Notifications/NotificationsDrawer';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Active User Profile & Role Switcher
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-admin-01',
    email: 'pritamghoshyt7@gmail.com',
    name: 'Dr. Pritam Ghosh',
    role: 'Super Admin',
    createdAt: new Date().toISOString(),
  });

  // Database Data State (initialized with realistic clinical diagnostic seed data)
  const [centres, setCentres] = useState<CollectionCentre[]>(INITIAL_CENTRES);
  const [collectors, setCollectors] = useState<Collector[]>(INITIAL_COLLECTORS);
  const [gpsDevices, setGpsDevices] = useState<GpsDevice[]>(INITIAL_GPS_DEVICES);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [samples, setSamples] = useState<Sample[]>(INITIAL_SAMPLES);
  const [trips, setTrips] = useState<LogisticsTrip[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  // Cross-module contextual triggers
  const [activeDetailSample, setActiveDetailSample] = useState<Sample | null>(null);
  const [preselectedPatientForSample, setPreselectedPatientForSample] = useState<Patient | null>(null);

  // Test connection and seed database on initial boot
  useEffect(() => {
    testConnection().then((ok) => {
      if (ok) {
        seedInitialDatabaseIfEmpty();
      }
    });

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUser((prev) => ({
          ...prev,
          id: user.uid,
          email: user.email || 'pritamghoshyt7@gmail.com',
          name: user.displayName || user.email?.split('@')[0] || 'Health Point Admin',
        }));
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore Listeners with error handling conforming strictly to skill
  useEffect(() => {
    // 1. Collection Centres
    const unsubCentres = onSnapshot(
      collection(db, 'collectionCentres'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CollectionCentre[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as CollectionCentre));
          setCentres(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'collectionCentres');
      }
    );

    // 2. Collectors
    const unsubCollectors = onSnapshot(
      collection(db, 'collectors'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Collector[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as Collector));
          setCollectors(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'collectors');
      }
    );

    // 3. GPS Devices
    const unsubGps = onSnapshot(
      collection(db, 'gpsDevices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: GpsDevice[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as GpsDevice));
          setGpsDevices(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'gpsDevices');
      }
    );

    // 4. Patients
    const unsubPatients = onSnapshot(
      collection(db, 'patients'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Patient[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as Patient));
          setPatients(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'patients');
      }
    );

    // 5. Samples
    const unsubSamples = onSnapshot(
      collection(db, 'samples'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Sample[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as Sample));
          setSamples(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'samples');
      }
    );

    // 6. Logistics Trips
    const unsubTrips = onSnapshot(
      collection(db, 'logisticsTrips'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: LogisticsTrip[] = [];
          snapshot.forEach((docSnap) => list.push(docSnap.data() as LogisticsTrip));
          setTrips(list);
        }
      },
      (error) => {
        // Non-blocking for trips
      }
    );

    // 7. System Settings
    const unsubSettings = onSnapshot(
      collection(db, 'systemSettings'),
      (snapshot) => {
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => setSettings(docSnap.data() as SystemSettings));
        }
      },
      (error) => {
        // Non-blocking for settings
      }
    );

    return () => {
      unsubCentres();
      unsubCollectors();
      unsubGps();
      unsubPatients();
      unsubSamples();
      unsubTrips();
      unsubSettings();
    };
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  const handleBookSampleForPatient = (patient: Patient) => {
    setPreselectedPatientForSample(patient);
    setActiveTab('samples');
  };

  const handleOpenSampleDetail = (sample: Sample) => {
    setActiveDetailSample(sample);
    setActiveTab('samples');
  };

  const inTransitCount = samples.filter(
    (s) => s.status === 'IN TRANSIT' || s.status === 'PICKED UP'
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        sampleCount={samples.length}
        inTransitCount={inTransitCount}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          currentUser={currentUser}
          onChangeUserRole={handleRoleChange}
          onlineGpsCount={gpsDevices.filter((d) => d.serverConnectionStatus === 'ONLINE').length}
          pendingAlertsCount={samples.filter((s) => s.status === 'REJECTED').length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                centres={centres}
                collectors={collectors}
                gpsDevices={gpsDevices}
                samples={samples}
                patients={patients}
                trips={trips}
                currentUser={currentUser}
                onNavigateTab={setActiveTab}
                onSelectSampleDetail={handleOpenSampleDetail}
              />
            )}

            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Live Logistics Radar Map</h2>
                    <p className="text-xs text-slate-500">
                      Real-time positions of field runners, partner collection centres, and route vectors to Central Reference Lab
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                  >
                    Mobile GPS Broadcast
                  </button>
                </div>
                <LiveLogisticsMap
                  centres={centres}
                  collectors={collectors}
                  gpsDevices={gpsDevices}
                  onSelectCentre={() => setActiveTab('centres')}
                  onSelectCollector={() => setActiveTab('tracking')}
                />
              </div>
            )}

            {activeTab === 'centres' && (
              <CentresModule
                centres={centres}
                collectors={collectors}
                samples={samples}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'patients' && (
              <PatientsModule
                patients={patients}
                centres={centres}
                samples={samples}
                currentUser={currentUser}
                onBookSampleForPatient={handleBookSampleForPatient}
                onOpenSampleDetail={handleOpenSampleDetail}
              />
            )}

            {activeTab === 'samples' && (
              <SamplesModule
                samples={samples}
                patients={patients}
                centres={centres}
                collectors={collectors}
                currentUser={currentUser}
                settings={settings}
                preselectedPatient={preselectedPatientForSample}
                onClearPreselectedPatient={() => setPreselectedPatientForSample(null)}
                activeDetailSample={activeDetailSample}
                onCloseDetail={() => setActiveDetailSample(null)}
                onOpenDetail={(sample) => setActiveDetailSample(sample)}
              />
            )}

            {activeTab === 'scanner' && (
              <ScannerModule
                samples={samples}
                currentUser={currentUser}
                settings={settings}
                onOpenSampleDetail={handleOpenSampleDetail}
              />
            )}

            {activeTab === 'tracking' && (
              <TrackingModule
                collectors={collectors}
                centres={centres}
                gpsDevices={gpsDevices}
              />
            )}

            {activeTab === 'gps_hardware' && (
              <GpsHardwareModule
                gpsDevices={gpsDevices}
                collectors={collectors}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppModule
                samples={samples}
                centres={centres}
                collectors={collectors}
                settings={settings}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'collectors' && (
              <CollectorsModule
                collectors={collectors}
                centres={centres}
                gpsDevices={gpsDevices}
                samples={samples}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'logistics' && (
              <LogisticsModule
                trips={trips}
                centres={centres}
                collectors={collectors}
                samples={samples}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'lab_receiving' && (
              <LabReceivingModule
                samples={samples}
                centres={centres}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'billing' && (
              <BillingModule
                centres={centres}
                samples={samples}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsModule
                samples={samples}
                centres={centres}
                collectors={collectors}
                gpsDevices={gpsDevices}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsModule
                settings={settings}
                currentUser={currentUser}
                onChangeUserRole={handleRoleChange}
              />
            )}

            {activeTab === 'platforms' && <PlatformsModule />}
          </div>
        </main>
      </div>

      {/* Notifications Slide-over Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        samples={samples}
        centres={centres}
        collectors={collectors}
        gpsDevices={gpsDevices}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}
