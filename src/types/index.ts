export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Centre Operator'
  | 'Collector'
  | 'Lab Receiver'
  | 'Accounts Manager';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  centreId?: string;
  assignedCollectorId?: string;
  phone?: string;
  createdAt: string;
}

export interface CollectionCentre {
  id: string;
  name: string;
  centreCode: string;
  ownerName: string;
  contactPerson: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  fullAddress: string;
  pinCode: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  sampleRateDiscountPercent?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  address: string;
  centreId: string;
  centreName: string;
  registrationDate: string;
  createdAt: string;
}

export type SampleStatus =
  | 'REGISTERED'
  | 'COLLECTED'
  | 'PICKUP REQUESTED'
  | 'PICKED UP'
  | 'IN TRANSIT'
  | 'ARRIVED AT LAB'
  | 'RECEIVED AND VERIFIED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ON HOLD';

export interface SampleMovement {
  status: SampleStatus;
  timestamp: string;
  performedBy: string;
  performedByName: string;
  location?: string;
  remarks?: string;
}

export interface Sample {
  id: string;
  sampleId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientMobile?: string;
  centreId: string;
  centreName: string;
  testName: string;
  testCategory?: string;
  sampleType:
    | 'EDTA Whole Blood'
    | 'Serum (SST Gel)'
    | 'Fluoride Plasma'
    | 'Sodium Citrate'
    | 'Urine Sterile Container'
    | 'Nasopharyngeal Swab'
    | 'Sputum'
    | 'Stool'
    | 'Biopsy / Tissue';
  barcodeNumber: string;
  qrCode: string;
  collectionDateTime: string;
  collectorName?: string;
  collectorId?: string;
  destinationLab: string;
  status: SampleStatus;
  remarks?: string;
  temperature?: string;
  containerColor?: string;
  rejectionReason?: string;
  movementHistory: SampleMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface Collector {
  id: string;
  collectorId: string;
  name: string;
  mobileNumber: string;
  whatsappNumber: string;
  employeeId: string;
  assignedCentres: string[]; // centre IDs
  assignedGpsDeviceId?: string;
  assignedVehicle: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_DUTY' | 'OFF_DUTY';
  currentLatitude: number;
  currentLongitude: number;
  lastLocationUpdate: string;
  batteryLevel?: number;
  speedKmh?: number;
  isOnline: boolean;
  dailyCollectionsCount?: number;
}

export type GpsProtocol = 'GT06' | 'TELTONIKA' | 'CONCOX' | 'TK103' | 'QUECLINK' | 'JSON_REST';

export interface GpsDevice {
  id: string;
  imei: string;
  deviceName: string;
  simNumber: string;
  vehicleNumber: string;
  assignedCollectorId?: string;
  assignedCollectorName?: string;
  deviceProtocol: GpsProtocol;
  serverConnectionStatus: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  lastGpsUpdate: string;
  latitude: number;
  longitude: number;
  speed: number;
  batteryStatus: string;
  gpsSignalStatus: 'STRONG' | 'MODERATE' | 'WEAK' | 'NO_SIGNAL';
}

export interface LogisticsTrip {
  id: string;
  tripCode: string;
  centreId: string;
  centreName: string;
  collectorId: string;
  collectorName: string;
  vehicleNumber: string;
  destinationLab: string;
  pickupTime: string;
  expectedDeliveryTime: string;
  sampleCount: number;
  sampleIds: string[];
  status: 'REQUESTED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'DELAYED';
  delayReason?: string;
  notes?: string;
  createdAt: string;
}

export interface LabReceipt {
  id: string;
  manifestNumber: string;
  receivedAt: string;
  receiverName: string;
  receiverUserId: string;
  centreId?: string;
  centreName?: string;
  collectorName?: string;
  scannedSampleIds: string[];
  verifiedCount: number;
  missingCount: number;
  damagedCount: number;
  rejectionNotes?: string;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  invoiceNumber: string;
  centreId: string;
  centreName: string;
  period: string;
  sampleCount: number;
  sampleCharges: number;
  pickupCharges: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  dueDate: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'SAMPLE' | 'CENTRE' | 'PATIENT' | 'COLLECTOR' | 'DISPATCH' | 'LAB_RECEIPT' | 'BILLING' | 'AUTH';
  entityId: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details: string;
}

export interface SystemSettings {
  id: string;
  labName: string;
  labAddress: string;
  contactNumber: string;
  whatsappNumber: string;
  email: string;
  sampleIdPrefix: string;
  centreIdPrefix: string;
  barcodePrefix: string;
  gpsServerHost: string;
  gpsServerPort: number;
  whatsappEnglishTemplate: string;
  whatsappBengaliTemplate: string;
}

export interface TestCatalogItem {
  id: string;
  name: string;
  category: string;
  sampleType: Sample['sampleType'];
  container: string;
  containerColor: string;
  tatHours: number;
  rate: number;
}
