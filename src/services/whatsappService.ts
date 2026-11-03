import { Sample, SystemSettings } from '../types';

export interface WhatsAppMessagePayload {
  recipientName: string;
  recipientPhone: string;
  sample: Sample;
  templateType: 'PICKUP' | 'DISPATCH' | 'RECEIVED' | 'DELIVERY' | 'PENDING_ALERT';
  language: 'EN' | 'BN';
}

export function formatWhatsAppMessage(
  templateText: string,
  sample: Sample,
  settings: SystemSettings,
  recipientName?: string
): string {
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return templateText
    .replace(/{NAME}/g, recipientName || sample.patientName)
    .replace(/{SAMPLE_ID}/g, sample.sampleId)
    .replace(/{TEST_NAME}/g, sample.testName)
    .replace(/{CENTRE_NAME}/g, sample.centreName)
    .replace(/{STATUS}/g, sample.status)
    .replace(/{COLLECTOR}/g, sample.collectorName || 'Health Point Logistics')
    .replace(/{TIMESTAMP}/g, now)
    .replace(/{APP_URL}/g, window.location.origin);
}

export function getWhatsAppClickToChatUrl(
  phone: string,
  message: string
): string {
  // Clean phone number (strip spaces, dashes, parentheses)
  let cleanNumber = phone.replace(/[^0-9]/g, '');
  // Default to Indian prefix if 10 digits
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  }
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
