import type { CSSProperties } from 'react';

declare module 'react' {
  interface CSSProperties {
    [customProp: `--${string}`]: string | number | undefined;
  }
}

const CX = 130;
const CY = 80;
const R = 60;
const HERO_VIEWBOX = '0 0 260 200';
const ICON_VIEWBOX = '65 15 130 130';

const LATITUDES: ReadonlyArray<{ cy: number; rx: number; ry: number }> = [
  { cy: 32, rx: 33, ry: 4 },
  { cy: 52, rx: 52, ry: 7 },
  { cy: 70, rx: 59, ry: 9 },
  { cy: 90, rx: 59, ry: 9 },
  { cy: 108, rx: 52, ry: 7 },
  { cy: 128, rx: 33, ry: 4 },
];

const LONGITUDES: ReadonlyArray<{ rx: number; sweep: 0 | 1 }> = [
  { rx: 50, sweep: 1 },
  { rx: 40, sweep: 1 },
  { rx: 25, sweep: 1 },
  { rx: 8, sweep: 1 },
  { rx: 8, sweep: 0 },
  { rx: 25, sweep: 0 },
  { rx: 40, sweep: 0 },
  { rx: 50, sweep: 0 },
];

const DIAMOND_PATH = 'M 0 -3.5 L 3.5 0 L 0 3.5 L -3.5 0 Z';

interface RingSpec {
  rx: number;
  ry: number;
  cls: 'ring-1' | 'ring-2' | 'ring-3';
  stroke: number;
  opacity: number;
}

const RINGS: ReadonlyArray<RingSpec> = [
  { rx: 72, ry: 72, cls: 'ring-1', stroke: 0.8, opacity: 0.55 },
  { rx: 78, ry: 62, cls: 'ring-2', stroke: 0.7, opacity: 0.5 },
  { rx: 86, ry: 34, cls: 'ring-3', stroke: 0.6, opacity: 0.45 },
];

interface IdleParticle {
  x: number;
  y: number;
  r: number;
  color: string;
  op: number;
  dur: number;
  delay: number;
}

const IDLE_PARTICLES: ReadonlyArray<IdleParticle> = [
  { x: 18, y: 22, r: 2, color: '#FF6060', op: 0.6, dur: 3.4, delay: 0 },
  { x: 42, y: 12, r: 1.5, color: '#FFFFFF', op: 0.5, dur: 4.2, delay: 0.7 },
  { x: 245, y: 25, r: 2.5, color: '#FF2020', op: 0.7, dur: 3.6, delay: 0.3 },
  { x: 220, y: 12, r: 1.5, color: '#FFFFFF', op: 0.4, dur: 4.5, delay: 1.1 },
  { x: 15, y: 70, r: 2, color: '#FF2020', op: 0.55, dur: 3.5, delay: 0.8 },
  { x: 246, y: 95, r: 2.5, color: '#FF6060', op: 0.6, dur: 3.9, delay: 0.2 },
  { x: 8, y: 130, r: 1.5, color: '#FFFFFF', op: 0.5, dur: 4.2, delay: 0.5 },
  { x: 252, y: 138, r: 2, color: '#FF2020', op: 0.6, dur: 3.7, delay: 1.2 },
  { x: 35, y: 168, r: 2.5, color: '#FF6060', op: 0.5, dur: 4.0, delay: 0.4 },
  { x: 225, y: 162, r: 2, color: '#FFFFFF', op: 0.4, dur: 3.5, delay: 0.9 },
  { x: 60, y: 6, r: 1.5, color: '#FF2020', op: 0.55, dur: 4.3, delay: 1.5 },
  { x: 198, y: 5, r: 2, color: '#FF6060', op: 0.6, dur: 3.8, delay: 0.7 },
  { x: 80, y: 178, r: 1.5, color: '#FF2020', op: 0.45, dur: 4.6, delay: 1.0 },
  { x: 178, y: 182, r: 2.5, color: '#FF6060', op: 0.5, dur: 3.3, delay: 1.6 },
  { x: 3, y: 50, r: 2, color: '#FFFFFF', op: 0.35, dur: 4.0, delay: 0.1 },
  { x: 256, y: 58, r: 1.5, color: '#FF6060', op: 0.55, dur: 3.6, delay: 0.4 },
  { x: 2, y: 105, r: 2, color: '#FF2020', op: 0.6, dur: 3.9, delay: 1.3 },
  { x: 257, y: 118, r: 2, color: '#FFFFFF', op: 0.4, dur: 4.4, delay: 0.6 },
];

interface DataPulse {
  path: string;
  dur: number;
  delay: number;
  r: number;
}

const DATA_PULSES: ReadonlyArray<DataPulse> = [
  { path: 'M 8 22 Q 50 50 88 72', dur: 5, delay: 0, r: 2 },
  { path: 'M 248 28 Q 200 50 170 70', dur: 6, delay: 1.3, r: 1.8 },
  { path: 'M 10 168 Q 60 130 90 110', dur: 5.5, delay: 0.6, r: 2 },
  { path: 'M 252 172 Q 200 132 168 108', dur: 6.5, delay: 1.9, r: 1.8 },
  { path: 'M 130 2 Q 158 28 140 50', dur: 4.5, delay: 2.4, r: 2.2 },
  { path: 'M 130 196 Q 102 168 122 130', dur: 7, delay: 0.9, r: 2 },
];

const STYLES = `
.crisisiq-svg { display: block; background: transparent; overflow: visible; }

.crisisiq-svg .idle-particle {
  transform-box: fill-box;
  transform-origin: center;
  animation-name: ciq-particle-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes ciq-particle-float {
  0%, 100% {
    transform: translateY(0);
    opacity: var(--p-op, 0.5);
  }
  50% {
    transform: translateY(-6px);
    opacity: calc(var(--p-op, 0.5) * 0.35);
  }
}

.crisisiq-svg .ring-group {
  transform-box: fill-box;
  transform-origin: center;
}
.crisisiq-svg .ring-1 {
  animation: ciq-ring-z 12s linear infinite;
}
@keyframes ciq-ring-z {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.crisisiq-svg .ring-2 {
  animation: ciq-ring-y 8s linear infinite reverse;
}
@keyframes ciq-ring-y {
  from { transform: perspective(800px) rotateY(0deg); }
  to { transform: perspective(800px) rotateY(360deg); }
}
.crisisiq-svg .ring-3 {
  animation: ciq-ring-x 18s linear infinite;
}
@keyframes ciq-ring-x {
  from { transform: perspective(800px) rotateX(0deg); }
  to { transform: perspective(800px) rotateX(360deg); }
}

.crisisiq-svg .scanline {
  transform-box: fill-box;
  animation: ciq-scanline 2.5s ease-in-out infinite;
}
@keyframes ciq-scanline {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(120px); opacity: 0; }
}

.crisisiq-svg .globe-glow {
  filter: drop-shadow(0 0 3px rgba(204, 0, 0, 0.55))
          drop-shadow(0 0 10px rgba(255, 32, 32, 0.28));
}

.crisisiq-svg .wordmark {
  fill: #FF2020;
  font-family: 'Orbitron', 'Inter', system-ui, sans-serif;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.15em;
  filter: drop-shadow(0 0 2px rgba(255, 32, 32, 0.55))
          drop-shadow(0 0 6px rgba(255, 32, 32, 0.22));
  animation: ciq-wordmark-reveal 0.8s ease-out 1 both;
}
@keyframes ciq-wordmark-reveal {
  0% { letter-spacing: 0.4em; opacity: 0; }
  100% { letter-spacing: 0.15em; opacity: 1; }
}

.crisisiq-svg .glow-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: ciq-glow-pulse 2s ease-in-out infinite;
}
@keyframes ciq-glow-pulse {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .crisisiq-svg .idle-particle,
  .crisisiq-svg .ring-1,
  .crisisiq-svg .ring-2,
  .crisisiq-svg .ring-3,
  .crisisiq-svg .scanline,
  .crisisiq-svg .wordmark,
  .crisisiq-svg .glow-pulse {
    animation: none !important;
  }
  .crisisiq-svg .data-pulses { display: none; }
  .crisisiq-svg .wordmark { letter-spacing: 0.15em; opacity: 1; }
}
`;

export interface CrisisIqBrandMarkProps {
  variant?: 'hero' | 'nav' | 'inline';
  className?: string;
  label?: string;
}

const SIZE: Record<NonNullable<CrisisIqBrandMarkProps['variant']>, { w: number; h: number }> = {
  hero: { w: 260, h: 200 },
  nav: { w: 40, h: 40 },
  inline: { w: 32, h: 32 },
};

/**
 * CrisisIQ animated logo — self-contained SVG with embedded keyframes.
 * Transparent background, no wrapper boxes, no <img>.
 */
export function CrisisIqBrandMark({
  variant = 'hero',
  className = '',
  label = 'CrisisIQ',
}: CrisisIqBrandMarkProps) {
  const isHero = variant === 'hero';
  const viewBox = isHero ? HERO_VIEWBOX : ICON_VIEWBOX;
  const { w, h } = SIZE[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={w}
      height={h}
      role="img"
      aria-label={label}
      className={`crisisiq-svg ${className}`.trim()}
      fill="none"
    >
      <style>{STYLES}</style>
      <defs>
        <radialGradient id="ciq-globe-fill" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#1a0000" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <clipPath id="ciq-globe-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <filter id="ciq-edge-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {isHero && (
        <g aria-hidden>
          {IDLE_PARTICLES.map((p, i) => {
            const style: CSSProperties = {
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              '--p-op': p.op,
            };
            return (
              <circle
                key={`p-${i}`}
                className="idle-particle"
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={p.color}
                opacity={p.op}
                style={style}
              />
            );
          })}
          <g className="data-pulses">
            {DATA_PULSES.map((dp, i) => (
              <circle key={`dp-${i}`} r={dp.r} fill="#FF2020" opacity={0}>
                <animateMotion
                  dur={`${dp.dur}s`}
                  repeatCount="indefinite"
                  begin={`${dp.delay}s`}
                  path={dp.path}
                />
                <animate
                  attributeName="opacity"
                  values="0; 0.95; 0.95; 0; 0"
                  keyTimes="0; 0.1; 0.55; 0.8; 1"
                  dur={`${dp.dur}s`}
                  repeatCount="indefinite"
                  begin={`${dp.delay}s`}
                />
              </circle>
            ))}
          </g>
        </g>
      )}

      <g className="globe-glow">
        <circle cx={CX} cy={CY} r={R} fill="url(#ciq-globe-fill)" />

        <g
          clipPath="url(#ciq-globe-clip)"
          stroke="#3D0000"
          strokeWidth="0.7"
          fill="none"
          aria-hidden
        >
          {LATITUDES.map((lat, i) => (
            <ellipse key={`lat-${i}`} cx={CX} cy={lat.cy} rx={lat.rx} ry={lat.ry} />
          ))}
          {LONGITUDES.map((lon, i) => (
            <path
              key={`lon-${i}`}
              d={`M ${CX} ${CY - R} A ${lon.rx} ${R} 0 0 ${lon.sweep} ${CX} ${CY + R}`}
            />
          ))}
        </g>

        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#CC0000"
          strokeWidth="1"
          filter="url(#ciq-edge-glow)"
        />

        {isHero && (
          <g clipPath="url(#ciq-globe-clip)" aria-hidden>
            <rect
              className="scanline"
              x={CX - R}
              y={CY - R}
              width={R * 2}
              height="5"
              fill="#FF2020"
              opacity="0.08"
            />
          </g>
        )}
      </g>

      {!isHero && (
        <circle
          className="glow-pulse"
          cx={CX}
          cy={CY}
          r={R + 3}
          fill="none"
          stroke="#FF2020"
          strokeWidth="1.5"
          opacity="0.6"
          filter="url(#ciq-edge-glow)"
          aria-hidden
        />
      )}

      {isHero && (
        <g aria-hidden>
          {RINGS.map(({ rx, ry, cls, stroke, opacity }) => (
            <g key={cls} className={`ring-group ${cls}`}>
              <ellipse
                cx={CX}
                cy={CY}
                rx={rx}
                ry={ry}
                stroke="#FF2020"
                strokeWidth={stroke}
                opacity={opacity}
                fill="none"
              />
              {[
                [CX + rx, CY],
                [CX, CY + ry],
                [CX - rx, CY],
                [CX, CY - ry],
              ].map(([x, y], i) => (
                <path
                  key={`${cls}-tick-${i}`}
                  d={DIAMOND_PATH}
                  transform={`translate(${x} ${y})`}
                  fill="#FF2020"
                  opacity="0.9"
                />
              ))}
            </g>
          ))}
        </g>
      )}

      {isHero && (
        <text className="wordmark" x={CX} y={170} textAnchor="middle">
          CrisisIQ
        </text>
      )}
    </svg>
  );
}
