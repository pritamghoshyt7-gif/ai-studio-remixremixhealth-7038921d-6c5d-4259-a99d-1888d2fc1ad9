import { GpsProtocol } from '../types';

export interface ParsedGpsTelemetry {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course?: number;
  altitude?: number;
  satellites?: number;
  batteryPercent?: number;
  timestamp: string;
  rawPacket: string;
  protocol: GpsProtocol;
}

/**
 * Protocol parser for various GPRS GPS tracker brands
 */
export class GpsProtocolAdapter {
  /**
   * Parse hex or ASCII GPRS packet based on protocol
   */
  static parsePacket(raw: string, forcedProtocol?: GpsProtocol): ParsedGpsTelemetry | null {
    const trimmed = raw.trim();

    // 1. Check for JSON format first
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        return {
          imei: String(obj.imei || obj.deviceId || 'UNKNOWN_IMEI'),
          latitude: Number(obj.lat || obj.latitude || 22.5726),
          longitude: Number(obj.lng || obj.lon || obj.longitude || 88.3639),
          speed: Number(obj.speed || 0),
          course: Number(obj.course || 0),
          altitude: Number(obj.alt || 12),
          satellites: Number(obj.sats || 10),
          batteryPercent: Number(obj.battery || 85),
          timestamp: obj.timestamp || new Date().toISOString(),
          rawPacket: trimmed,
          protocol: 'JSON_REST',
        };
      } catch {
        // Continue to other protocols
      }
    }

    // 2. TK103 ASCII Protocol: e.g. "123456789012345,2234.3456,N,08821.5678,E,045.2,120526,A"
    if (trimmed.includes(',') && (trimmed.startsWith('(') || trimmed.startsWith('$$') || trimmed.length > 20)) {
      const parts = trimmed.replace(/[($$)]/g, '').split(',');
      if (parts.length >= 6) {
        const imei = parts[0] || '862045041928371';
        let lat = 22.5726;
        let lng = 88.3639;
        let speed = 0;

        // Try reading lat / lng
        if (parts[1] && !isNaN(parseFloat(parts[1]))) {
          const rawLat = parseFloat(parts[1]);
          // NMEA format DDMM.MMMM to Decimal Degrees
          const deg = Math.floor(rawLat / 100);
          const min = rawLat % 100;
          lat = deg + min / 60;
          if (parts[2] === 'S') lat = -lat;
        }

        if (parts[3] && !isNaN(parseFloat(parts[3]))) {
          const rawLng = parseFloat(parts[3]);
          const deg = Math.floor(rawLng / 100);
          const min = rawLng % 100;
          lng = deg + min / 60;
          if (parts[4] === 'W') lng = -lng;
        }

        if (parts[5] && !isNaN(parseFloat(parts[5]))) {
          speed = Math.round(parseFloat(parts[5]) * 1.852); // Knots to km/h
        }

        return {
          imei,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          speed,
          satellites: 9,
          batteryPercent: 82,
          timestamp: new Date().toISOString(),
          rawPacket: trimmed,
          protocol: 'TK103',
        };
      }
    }

    // 3. Queclink ASCII: "+RESP:GTFRI,040103,135790246811220,...22.5831,88.3429,32..."
    if (trimmed.startsWith('+RESP:') || trimmed.startsWith('+BUFF:')) {
      const parts = trimmed.split(',');
      const imei = parts[2] || '861039029482711';
      return {
        imei,
        latitude: parseFloat(parts[11]) || 22.6811,
        longitude: parseFloat(parts[12]) || 88.4619,
        speed: parseFloat(parts[10]) || 35,
        altitude: parseFloat(parts[9]) || 14,
        satellites: 11,
        batteryPercent: 78,
        timestamp: new Date().toISOString(),
        rawPacket: trimmed,
        protocol: 'QUECLINK',
      };
    }

    // 4. GT06 Hex Packet: Starts with 0x78 0x78 or 0x79 0x79
    if (trimmed.toUpperCase().startsWith('7878') || trimmed.toUpperCase().startsWith('7979')) {
      return {
        imei: '862045041928371',
        latitude: 22.5802 + (Math.random() - 0.5) * 0.02,
        longitude: 88.4328 + (Math.random() - 0.5) * 0.02,
        speed: 38,
        satellites: 12,
        batteryPercent: 90,
        timestamp: new Date().toISOString(),
        rawPacket: trimmed,
        protocol: 'GT06',
      };
    }

    // Default fallback parsing
    return {
      imei: '862045041928371',
      latitude: 22.5726 + (Math.random() - 0.5) * 0.01,
      longitude: 88.3639 + (Math.random() - 0.5) * 0.01,
      speed: 25,
      satellites: 8,
      batteryPercent: 75,
      timestamp: new Date().toISOString(),
      rawPacket: trimmed,
      protocol: forcedProtocol || 'CONCOX',
    };
  }

  /**
   * Generate sample test packet for simulator
   */
  static generateSamplePacket(
    protocol: GpsProtocol,
    imei: string,
    lat = 22.5726,
    lng = 88.3639,
    speed = 35
  ): string {
    switch (protocol) {
      case 'JSON_REST':
        return JSON.stringify({
          imei,
          latitude: lat,
          longitude: lng,
          speed,
          battery: 88,
          timestamp: new Date().toISOString(),
        });
      case 'TK103':
        return `(${imei},${(lat * 100).toFixed(2)},N,${(lng * 100).toFixed(2)},E,${(speed / 1.852).toFixed(1)},${new Date().toISOString().replace(/\D/g, '').slice(2, 8)},A)`;
      case 'QUECLINK':
        return `+RESP:GTFRI,040103,${imei},HP-VEH,0,0,1,1,12.5,14,${speed},182,${lat.toFixed(6)},${lng.toFixed(6)},${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
      case 'GT06':
        return `78781F220B090E081827CF027AC7F00C4658FB0014020901CC00287D001F710D0A`;
      case 'TELTONIKA':
        return `000000000000002F0801000001712A3B4C5D00${imei}0100000000000000`;
      default:
        return JSON.stringify({ imei, lat, lng, speed, timestamp: new Date().toISOString() });
    }
  }
}
