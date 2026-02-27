import { useEffect, useRef } from 'react';

// Lightweight QR code renderer using SVG-based approach
// We generate a visual QR-like pattern for demo purposes
// In production, swap with a real QR library like qrcode.react

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateQRMatrix(data, size = 21) {
  const seed = hashCode(data);
  const matrix = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      // Finder patterns (top-left, top-right, bottom-left corners)
      const inFinderTL = r < 7 && c < 7;
      const inFinderTR = r < 7 && c >= size - 7;
      const inFinderBL = r >= size - 7 && c < 7;
      if (inFinderTL || inFinderTR || inFinderBL) {
        const rr = inFinderTR ? r : r;
        const cc = inFinderTR ? c - (size - 7) : (inFinderBL ? c : c);
        const rLocal = inFinderBL ? r - (size - 7) : r;
        const cLocal = inFinderTR ? c - (size - 7) : c;
        const border = rLocal === 0 || rLocal === 6 || cLocal === 0 || cLocal === 6;
        const inner = rLocal >= 2 && rLocal <= 4 && cLocal >= 2 && cLocal <= 4;
        row.push(border || inner ? 1 : 0);
      } else {
        // Data modules based on hash
        row.push(((seed >> ((r * size + c) % 30)) & 1));
      }
    }
    matrix.push(row);
  }
  return matrix;
}

export default function QRCodeBox({ value, size = 80, label, showLabel = true }) {
  const matrixSize = 21;
  const matrix = generateQRMatrix(value, matrixSize);
  const cellSize = size / matrixSize;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ imageRendering: 'pixelated' }}
      >
        <rect width={size} height={size} fill="white" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
      {showLabel && label && (
        <p className="text-center text-[10px] font-mono font-bold text-slate-700 leading-tight max-w-full break-all">{label}</p>
      )}
    </div>
  );
}
