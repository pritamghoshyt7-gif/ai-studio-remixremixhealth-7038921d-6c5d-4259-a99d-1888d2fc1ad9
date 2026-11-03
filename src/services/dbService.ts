import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CollectionCentre,
  Collector,
  GpsDevice,
  Patient,
  Sample,
  SampleStatus,
  SampleMovement,
  LogisticsTrip,
  LabReceipt,
  BillingRecord,
  AuditLog,
  SystemSettings,
  UserProfile,
} from '../types';
import {
  INITIAL_CENTRES,
  INITIAL_COLLECTORS,
  INITIAL_GPS_DEVICES,
  INITIAL_PATIENTS,
  INITIAL_SAMPLES,
  INITIAL_SETTINGS,
} from './seedData';

// Generate standard format IDs
export function generateSampleId(prefix = 'HPS-2026-'): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
}

export function generateCentreId(prefix = 'HPC-'): string {
  const randomNum = Math.floor(10 + Math.random() * 90);
  return `${prefix}${randomNum}`;
}

export function generateBarcode(prefix = 'HP'): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomSuffix}`;
}

export function generatePatientId(prefix = 'HPP-'): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
}

// Seed initial database if empty
export async function seedInitialDatabaseIfEmpty(): Promise<void> {
  try {
    const centresSnap = await getDocs(collection(db, 'collectionCentres'));
    if (centresSnap.empty) {
      console.log('Seeding initial centres...');
      for (const centre of INITIAL_CENTRES) {
        await setDoc(doc(db, 'collectionCentres', centre.id), centre);
      }
    }

    const collectorsSnap = await getDocs(collection(db, 'collectors'));
    if (collectorsSnap.empty) {
      console.log('Seeding initial collectors...');
      for (const collector of INITIAL_COLLECTORS) {
        await setDoc(doc(db, 'collectors', collector.id), collector);
      }
    }

    const gpsSnap = await getDocs(collection(db, 'gpsDevices'));
    if (gpsSnap.empty) {
      console.log('Seeding initial GPS devices...');
      for (const device of INITIAL_GPS_DEVICES) {
        await setDoc(doc(db, 'gpsDevices', device.id), device);
      }
    }

    const patientsSnap = await getDocs(collection(db, 'patients'));
    if (patientsSnap.empty) {
      console.log('Seeding initial patients...');
      for (const patient of INITIAL_PATIENTS) {
        await setDoc(doc(db, 'patients', patient.id), patient);
      }
    }

    const samplesSnap = await getDocs(collection(db, 'samples'));
    if (samplesSnap.empty) {
      console.log('Seeding initial samples...');
      for (const sample of INITIAL_SAMPLES) {
        await setDoc(doc(db, 'samples', sample.id), sample);
      }
    }

    const settingsSnap = await getDocs(collection(db, 'systemSettings'));
    if (settingsSnap.empty) {
      console.log('Seeding initial settings...');
      await setDoc(doc(db, 'systemSettings', INITIAL_SETTINGS.id), INITIAL_SETTINGS);
    }
  } catch (err) {
    console.warn('Initial seeding check failed or skipped (may be running offline or limited):', err);
  }
}

// ----------------- AUDIT LOGGING -----------------
export async function logAuditEvent(
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  details: string,
  user: { uid?: string; name?: string }
): Promise<void> {
  const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const auditDoc: AuditLog = {
    id: logId,
    action,
    entityType,
    entityId,
    performedBy: user.uid || 'system',
    performedByName: user.name || 'Admin',
    timestamp: new Date().toISOString(),
    details,
  };
  try {
    await setDoc(doc(db, 'auditLogs', logId), auditDoc);
  } catch (error) {
    // Non-blocking error for audit logs
    console.warn('Could not write audit log:', error);
  }
}

// ----------------- SAMPLES -----------------
export async function saveSample(
  sample: Sample,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `samples/${sample.id}`;
  try {
    await setDoc(doc(db, 'samples', sample.id), sample);
    await logAuditEvent(
      'CREATE_SAMPLE',
      'SAMPLE',
      sample.sampleId,
      `New sample created for ${sample.patientName} (${sample.testName}) at ${sample.centreName}`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateSampleStatus(
  sampleId: string,
  sampleDocId: string,
  newStatus: SampleStatus,
  user: { uid?: string; name?: string; role?: string },
  location?: string,
  remarks?: string
): Promise<void> {
  const path = `samples/${sampleDocId}`;
  try {
    const movement: SampleMovement = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      performedBy: user.uid || 'user',
      performedByName: `${user.name || 'User'} (${user.role || 'Staff'})`,
      location: location || 'Logistics Point',
      remarks: remarks || `Status transitioned to ${newStatus}`,
    };

    // We use array union or fetch & update
    const sampleRef = doc(db, 'samples', sampleDocId);
    await updateDoc(sampleRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      movementHistory: [movement], // Caller or cloud will append; client merges
    });

    await logAuditEvent(
      'UPDATE_SAMPLE_STATUS',
      'SAMPLE',
      sampleId,
      `Sample ${sampleId} moved to status: ${newStatus}. Remarks: ${remarks || 'None'}`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ----------------- CENTRES -----------------
export async function saveCentre(
  centre: CollectionCentre,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `collectionCentres/${centre.id}`;
  try {
    await setDoc(doc(db, 'collectionCentres', centre.id), centre);
    await logAuditEvent(
      'SAVE_CENTRE',
      'CENTRE',
      centre.centreCode,
      `Collection Centre ${centre.name} (${centre.centreCode}) updated/created`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCentre(
  centreId: string,
  centreName: string,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `collectionCentres/${centreId}`;
  try {
    await deleteDoc(doc(db, 'collectionCentres', centreId));
    await logAuditEvent(
      'DELETE_CENTRE',
      'CENTRE',
      centreId,
      `Collection Centre ${centreName} deleted`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------- PATIENTS -----------------
export async function savePatient(
  patient: Patient,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `patients/${patient.id}`;
  try {
    await setDoc(doc(db, 'patients', patient.id), patient);
    await logAuditEvent(
      'SAVE_PATIENT',
      'PATIENT',
      patient.id,
      `Patient ${patient.name} (${patient.gender}, ${patient.age}y) registered at ${patient.centreName}`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- COLLECTORS -----------------
export async function saveCollector(
  collector: Collector,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `collectors/${collector.id}`;
  try {
    await setDoc(doc(db, 'collectors', collector.id), collector);
    await logAuditEvent(
      'SAVE_COLLECTOR',
      'COLLECTOR',
      collector.collectorId,
      `Collector ${collector.name} (${collector.assignedVehicle}) updated`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCollectorLocation(
  collectorId: string,
  latitude: number,
  longitude: number,
  speed = 0,
  battery = 100
): Promise<void> {
  const path = `collectors/${collectorId}`;
  try {
    await updateDoc(doc(db, 'collectors', collectorId), {
      currentLatitude: latitude,
      currentLongitude: longitude,
      speedKmh: speed,
      batteryLevel: battery,
      lastLocationUpdate: new Date().toISOString(),
      isOnline: true,
    });
  } catch (error) {
    console.warn('Could not update collector live location:', error);
  }
}

// ----------------- GPS DEVICES -----------------
export async function saveGpsDevice(
  device: GpsDevice,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `gpsDevices/${device.id}`;
  try {
    await setDoc(doc(db, 'gpsDevices', device.id), device);
    await logAuditEvent(
      'SAVE_GPS_DEVICE',
      'COLLECTOR',
      device.imei,
      `GPS Device ${device.deviceName} (IMEI: ${device.imei}, Vehicle: ${device.vehicleNumber}) registered`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- LOGISTICS TRIPS -----------------
export async function saveLogisticsTrip(
  trip: LogisticsTrip,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `logisticsTrips/${trip.id}`;
  try {
    await setDoc(doc(db, 'logisticsTrips', trip.id), trip);
    await logAuditEvent(
      'CREATE_DISPATCH_TRIP',
      'DISPATCH',
      trip.tripCode,
      `Logistics Trip ${trip.tripCode} dispatched from ${trip.centreName} to ${trip.destinationLab} (${trip.sampleCount} samples)`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- LAB RECEIVING -----------------
export async function saveLabReceipt(
  receipt: LabReceipt,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `labReceipts/${receipt.id}`;
  try {
    await setDoc(doc(db, 'labReceipts', receipt.id), receipt);
    await logAuditEvent(
      'LAB_RECEIVE_MANIFEST',
      'LAB_RECEIPT',
      receipt.manifestNumber,
      `Laboratory receiving manifest ${receipt.manifestNumber} processed: ${receipt.verifiedCount} verified, ${receipt.damagedCount} rejected, ${receipt.missingCount} missing`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- BILLING RECORDS -----------------
export async function saveBillingRecord(
  bill: BillingRecord,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `billingRecords/${bill.id}`;
  try {
    await setDoc(doc(db, 'billingRecords', bill.id), bill);
    await logAuditEvent(
      'SAVE_BILLING_INVOICE',
      'BILLING',
      bill.invoiceNumber,
      `Billing invoice ${bill.invoiceNumber} for ${bill.centreName}: Amount ₹${bill.totalAmount}, Status: ${bill.paymentStatus}`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- SYSTEM SETTINGS -----------------
export async function saveSystemSettings(
  settings: SystemSettings,
  user: { uid?: string; name?: string }
): Promise<void> {
  const path = `systemSettings/${settings.id}`;
  try {
    await setDoc(doc(db, 'systemSettings', settings.id), settings);
    await logAuditEvent(
      'UPDATE_SETTINGS',
      'AUTH',
      settings.id,
      `Health Point ERP system configuration and templates updated`,
      user
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
