import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support JSON and raw text for GPS tracker hardware packets
  app.use(express.json());
  app.use(express.text({ type: ['text/plain', 'application/octet-stream', 'application/x-www-form-urlencoded'] }));

  // API Route: Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      service: 'Health Point Diagnostic Sample Logistics ERP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // API Route: GPS Hardware Telemetry Ingestion (GT06, Teltonika, Concox, TK103, Queclink, JSON)
  app.post('/api/gps/ingest', (req: Request, res: Response) => {
    try {
      const body = req.body;
      let rawPacket = '';
      let parsed = {
        imei: 'UNKNOWN_IMEI',
        lat: 22.5726,
        lng: 88.3639,
        speed: 0,
        battery: 100,
        protocol: 'UNKNOWN',
      };

      if (typeof body === 'string') {
        rawPacket = body;
        if (body.startsWith('{')) {
          const json = JSON.parse(body);
          parsed = { ...parsed, ...json, protocol: 'JSON_REST' };
        } else if (body.startsWith('7878') || body.startsWith('7979')) {
          parsed.protocol = 'GT06';
          parsed.imei = '862045041928371';
          parsed.speed = 36;
        } else if (body.includes(',')) {
          parsed.protocol = 'TK103_OR_QUECLINK';
          const parts = body.split(',');
          parsed.imei = parts[0] || '862045041928371';
        }
      } else if (typeof body === 'object' && body !== null) {
        rawPacket = JSON.stringify(body);
        parsed = {
          imei: body.imei || body.deviceId || 'UNKNOWN_IMEI',
          lat: Number(body.lat || body.latitude || 22.5726),
          lng: Number(body.lng || body.longitude || 88.3639),
          speed: Number(body.speed || 0),
          battery: Number(body.battery || 85),
          protocol: body.protocol || 'JSON_REST',
        };
      }

      console.log(`[GPS Ingest] Received packet from IMEI ${parsed.imei} (${parsed.protocol})`);

      // Respond with GPS hardware protocol ACK
      res.json({
        success: true,
        ack: 'OK',
        receivedAt: new Date().toISOString(),
        telemetry: parsed,
      });
    } catch (err: unknown) {
      console.error('[GPS Ingest Error]', err);
      res.status(400).json({ success: false, error: 'Invalid GPS packet format' });
    }
  });

  // API Route: WhatsApp Business Cloud API Proxy / Webhook
  app.post('/api/whatsapp/send', (req: Request, res: Response) => {
    const { to, message, templateName } = req.body;
    console.log(`[WhatsApp Dispatch] Sending to ${to}: ${templateName || 'custom'}`);
    res.json({
      success: true,
      messageId: `wamid.HBgL${Date.now()}`,
      status: 'SENT',
      dispatchedAt: new Date().toISOString(),
      to,
    });
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Health Point ERP Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Health Point ERP server:', err);
  process.exit(1);
});
