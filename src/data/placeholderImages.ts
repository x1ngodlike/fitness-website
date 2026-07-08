// 本地 SVG 占位封面：纯 data-URI，离线可渲染，无网络依赖。
// 用于测试数据（mock 挑战）以及任意封面为空时的兜底，避免出现破图。

const W = 1600;
const H = 900;

type Palette = { from: string; to: string; glow: string; accent: string };

const PALETTES: Palette[] = [
  { from: '#7c2d12', to: '#1a1208', glow: '#fb923c', accent: '#f97316' }, // 橙
  { from: '#134e4a', to: '#06181a', glow: '#2dd4bf', accent: '#14b8a6' }, // 青
  { from: '#1e3a8a', to: '#0a0f24', glow: '#60a5fa', accent: '#3b82f6' }, // 蓝
  { from: '#581c87', to: '#160a1f', glow: '#c084fc', accent: '#a855f7' }, // 紫
  { from: '#14532d', to: '#07140c', glow: '#4ade80', accent: '#22c55e' }, // 绿
  { from: '#881337', to: '#1f0710', glow: '#fb7185', accent: '#f43f5e' }, // 玫红
  { from: '#78350f', to: '#1c1306', glow: '#fbbf24', accent: '#f59e0b' }, // 琥珀
  { from: '#312e81', to: '#0c0b1f', glow: '#818cf8', accent: '#6366f1' }, // 靛
];

function buildCover(p: Palette): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.from}"/>
      <stop offset="1" stop-color="${p.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.22" r="0.6">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g fill="none" stroke="${p.accent}" stroke-opacity="0.18" stroke-width="3">
    <circle cx="1240" cy="220" r="180"/>
    <circle cx="1240" cy="220" r="300"/>
    <circle cx="300" cy="760" r="140"/>
  </g>
  <g fill="${p.glow}" fill-opacity="0.9">
    <circle cx="1240" cy="220" r="10"/>
    <circle cx="380" cy="700" r="8"/>
    <circle cx="900" cy="640" r="6"/>
  </g>
  <path d="M0 720 Q 400 640 800 700 T 1600 660" fill="none" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="6"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDER_COVERS: string[] = PALETTES.map(buildCover);

export const FALLBACK_COVER: string = (() => {
  const p = PALETTES[0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.from}"/>
      <stop offset="1" stop-color="${p.to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="${p.glow}" fill-opacity="0.12"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();
