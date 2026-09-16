import qrcode from "npm:qrcode-generator@1.4.4";

export function invoiceQr(value: string) {
  const qr = qrcode(0, "M");
  qr.addData(value, "Byte");
  qr.make();
  return qr;
}

export function invoiceQrSvg(value: string) {
  const qr = invoiceQr(value);
  const size = qr.getModuleCount();
  const paths: string[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) paths.push(`M${col + 4},${row + 4}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 ${size + 8} ${size + 8}" role="img" aria-label="Scan om deze factuur te betalen"><rect width="100%" height="100%" fill="white"/><path d="${paths.join("")}" fill="black"/></svg>`;
}
