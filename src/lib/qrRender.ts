import QRCode from "qrcode";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrRenderOptions {
  payload: string;
  fgColor: string;
  bgColor: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  qrSize: number;
  frameTopText: string;
  frameBottomText: string;
  frameColor: string;
  frameBgColor: string;
  cornerRadius: number;
}

interface Layout {
  width: number;
  height: number;
  quietZone: number;
  moduleCount: number;
  moduleSize: number;
  qrOffsetX: number;
  qrOffsetY: number;
  topBand: number;
  bottomBand: number;
  margin: number;
  fontSize: number;
}

const QUIET_ZONE = 2;
const MARGIN = 20;

function getMatrix(payload: string, errorCorrectionLevel: ErrorCorrectionLevel) {
  return QRCode.create(payload || " ", { errorCorrectionLevel });
}

function computeLayout(options: QrRenderOptions, moduleCount: number): Layout {
  const { qrSize, frameTopText, frameBottomText } = options;
  const moduleSize = qrSize / (moduleCount + QUIET_ZONE * 2);
  const fontSize = Math.max(14, Math.round(qrSize * 0.075));
  const bandHeight = Math.round(fontSize * 2.2);
  const hasFrameText = Boolean(frameTopText.trim() || frameBottomText.trim());
  const topBand = hasFrameText ? bandHeight : 0;
  const bottomBand = hasFrameText ? bandHeight : 0;
  const width = qrSize + MARGIN * 2;
  const height = qrSize + MARGIN * 2 + topBand + bottomBand;

  return {
    width,
    height,
    quietZone: QUIET_ZONE,
    moduleCount,
    moduleSize,
    qrOffsetX: MARGIN,
    qrOffsetY: MARGIN + topBand,
    topBand,
    bottomBand,
    margin: MARGIN,
    fontSize,
  };
}

export function renderQrToCanvas(canvas: HTMLCanvasElement, options: QrRenderOptions): void {
  const qr = getMatrix(options.payload, options.errorCorrectionLevel);
  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const layout = computeLayout(options, moduleCount);

  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = options.frameBgColor;
  roundRect(ctx, 0, 0, layout.width, layout.height, options.cornerRadius);
  ctx.fill();

  ctx.fillStyle = options.bgColor;
  ctx.fillRect(
    layout.qrOffsetX - layout.quietZone * layout.moduleSize,
    layout.qrOffsetY - layout.quietZone * layout.moduleSize,
    (moduleCount + layout.quietZone * 2) * layout.moduleSize,
    (moduleCount + layout.quietZone * 2) * layout.moduleSize
  );

  ctx.fillStyle = options.fgColor;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (data[row * moduleCount + col]) {
        ctx.fillRect(
          layout.qrOffsetX + col * layout.moduleSize,
          layout.qrOffsetY + row * layout.moduleSize,
          layout.moduleSize + 0.5,
          layout.moduleSize + 0.5
        );
      }
    }
  }

  ctx.fillStyle = options.frameColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${layout.fontSize}px Arial, sans-serif`;

  if (layout.topBand) {
    ctx.fillText(options.frameTopText, layout.width / 2, layout.margin + layout.topBand / 2, layout.width - layout.margin * 2);
  }
  if (layout.bottomBand) {
    ctx.fillText(
      options.frameBottomText,
      layout.width / 2,
      layout.height - layout.margin - layout.bottomBand / 2,
      layout.width - layout.margin * 2
    );
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderQrToSvgString(options: QrRenderOptions): string {
  const qr = getMatrix(options.payload, options.errorCorrectionLevel);
  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const layout = computeLayout(options, moduleCount);

  const modules: string[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (data[row * moduleCount + col]) {
        const x = layout.qrOffsetX + col * layout.moduleSize;
        const y = layout.qrOffsetY + row * layout.moduleSize;
        modules.push(
          `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(layout.moduleSize + 0.5).toFixed(
            2
          )}" height="${(layout.moduleSize + 0.5).toFixed(2)}" fill="${options.fgColor}" />`
        );
      }
    }
  }

  const texts: string[] = [];
  if (layout.topBand) {
    texts.push(
      `<text x="${layout.width / 2}" y="${layout.margin + layout.topBand / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${layout.fontSize}" fill="${options.frameColor}">${escapeXml(options.frameTopText)}</text>`
    );
  }
  if (layout.bottomBand) {
    texts.push(
      `<text x="${layout.width / 2}" y="${layout.height - layout.margin - layout.bottomBand / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${layout.fontSize}" fill="${options.frameColor}">${escapeXml(options.frameBottomText)}</text>`
    );
  }

  const quietX = layout.qrOffsetX - layout.quietZone * layout.moduleSize;
  const quietY = layout.qrOffsetY - layout.quietZone * layout.moduleSize;
  const quietSize = (moduleCount + layout.quietZone * 2) * layout.moduleSize;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <rect x="0" y="0" width="${layout.width}" height="${layout.height}" rx="${options.cornerRadius}" fill="${options.frameBgColor}" />
  <rect x="${quietX.toFixed(2)}" y="${quietY.toFixed(2)}" width="${quietSize.toFixed(2)}" height="${quietSize.toFixed(2)}" fill="${options.bgColor}" />
  ${modules.join("\n  ")}
  ${texts.join("\n  ")}
</svg>`;
}
