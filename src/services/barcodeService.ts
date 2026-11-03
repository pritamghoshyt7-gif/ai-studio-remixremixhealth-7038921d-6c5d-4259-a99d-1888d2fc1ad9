import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Web Audio scanner feedback sound
 */
export function playScanSuccessSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 note
    osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.08); // E6 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  } catch {
    // Audio context may require prior user interaction
  }
}

export function playScanErrorSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.31);
  } catch {
    // Silent fallback
  }
}

/**
 * Generate QR Code as Data URL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Render Barcode into an SVG element
 */
export function renderBarcodeSvg(svgElement: SVGSVGElement | null, code: string): void {
  if (!svgElement || !code) return;
  try {
    JsBarcode(svgElement, code, {
      format: 'CODE128',
      width: 1.6,
      height: 48,
      displayValue: true,
      fontSize: 12,
      font: 'monospace',
      lineColor: '#0f172a',
      margin: 4,
    });
  } catch (err) {
    console.error('Failed to render barcode:', err);
  }
}
