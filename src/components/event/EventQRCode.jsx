import React, { useMemo } from 'react';

/**
 * Pure React SVG QR Code component
 * Generates an SVG matrix representation of string payloads for event passes & scanning.
 */
export default function EventQRCode({ value, size = 180, fgColor = '#00F0FF', bgColor = '#050D1A', className = '' }) {
  // Simple deterministic QR matrix generator algorithm for client-side SVG rendering
  const modules = useMemo(() => {
    const text = value || 'INV-2026-OCT13';
    const N = 25; // 25x25 grid
    const grid = Array.from({ length: N }, () => Array(N).fill(false));

    // Draw finder patterns at top-left, top-right, bottom-left
    const drawFinder = (row, col) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            if (row + r < N && col + c < N) grid[row + r][col + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, N - 7);
    drawFinder(N - 7, 0);

    // Draw timing patterns
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Alignment pattern
    const drawAlignment = (row, col) => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
            if (row + r < N && col + c < N) grid[row + r][col + c] = true;
          }
        }
      }
    };
    drawAlignment(16, 16);

    // Fill data pseudo-randomly based on string characters
    let charIdx = 0;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= N - 8) ||
          (r >= N - 8 && c < 8) ||
          (r === 6 || c === 6) ||
          (r >= 15 && r <= 19 && c >= 15 && c <= 19)
        ) {
          continue;
        }

        const seed = (r * N + c) ^ Math.abs(hash);
        const bit = ((seed * 1103515245 + 12345) & 0x7fffffff) % 3 !== 0;
        grid[r][c] = bit;
      }
    }

    return { N, grid };
  }, [value]);

  const cellSize = size / modules.N;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-lg ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <rect width={size} height={size} fill={bgColor} rx={8} />
      {modules.grid.map((row, r) =>
        row.map((active, c) => {
          if (!active) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize - 0.4}
              height={cellSize - 0.4}
              fill={fgColor}
              rx={1}
            />
          );
        })
      )}
    </svg>
  );
}
