import React from 'react';

interface JhalakLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
  animate?: boolean;
}

export const JhalakLogo: React.FC<JhalakLogoProps> = ({
  size = 48,
  className = '',
  showGlow = true,
  animate = false,
}) => {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient Pulsing Glow behind badge */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 blur-md opacity-70 pointer-events-none transform scale-95"
          style={{
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* SVG Canvas */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${animate ? 'hover:scale-105 transition-transform duration-300' : ''}`}
      >
        <defs>
          {/* Main Sunset to Royal Violet-Pink Gradient */}
          <linearGradient
            id={`jhalak-badge-gradient-${uniqueId}`}
            x1="5%"
            y1="0%"
            x2="95%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FF5E3A" /> {/* Vibrant Sunset Orange */}
            <stop offset="45%" stopColor="#FF2A6D" /> {/* Radiant Rose Pink */}
            <stop offset="78%" stopColor="#9C27B0" /> {/* Indian Festive Purple */}
            <stop offset="100%" stopColor="#673AB7" /> {/* Royal Deep Violet */}
          </linearGradient>

          {/* Inner Vignette / Rim Gradient */}
          <linearGradient
            id={`jhalak-rim-gradient-${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>

          {/* Golden/White Glow for Letter J */}
          <linearGradient
            id={`jhalak-j-gradient-${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFF4E6" />
            <stop offset="100%" stopColor="#FFD1A4" />
          </linearGradient>

          {/* Shutter Blades Gradient */}
          <linearGradient
            id={`jhalak-blade-gradient-${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.12" />
          </linearGradient>

          {/* Soft Glow Filter for the J & Shutter */}
          <filter id={`jhalak-glow-${uniqueId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 1   0 1 0 0 0.8   0 0 1 0 0.8   0 0 0 0.7 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Badge Drop Shadow */}
          <filter id={`badge-shadow-${uniqueId}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Main Badge Base with Squircle shape */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill={`url(#jhalak-badge-gradient-${uniqueId})`}
          filter={`url(#badge-shadow-${uniqueId})`}
        />

        {/* Glossy top-left inner reflection highlight */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="23"
          stroke={`url(#jhalak-rim-gradient-${uniqueId})`}
          strokeWidth="1.8"
          fill="none"
        />

        {/* 2. Stylized Camera Body Elements */}
        {/* Camera Top Viewfinder / Flash bump bar */}
        <path
          d="M 37 13 Q 50 11 63 13 L 60 18 L 40 18 Z"
          fill="#FFFFFF"
          fillOpacity="0.25"
        />

        {/* Top-Right Camera Flash / Sensor Dot (Radially lit) */}
        <circle cx="76" cy="24" r="3.2" fill="#FFFFFF" opacity="0.95" />
        <circle cx="76" cy="24" r="6" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" />

        {/* 3. Outer Camera Lens Ring */}
        <circle
          cx="50"
          cy="52"
          r="30"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeOpacity="0.4"
          fill="#000000"
          fillOpacity="0.15"
        />
        <circle
          cx="50"
          cy="52"
          r="26"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="3 2"
        />

        {/* 4. Dynamic Camera Shutter Aperture Blades (6-blade swirl) */}
        <g stroke={`url(#jhalak-blade-gradient-${uniqueId})`} strokeWidth="1.4" strokeLinecap="round">
          {/* Blade 1 */}
          <path d="M 50 26 C 54 32, 60 38, 71 39" />
          {/* Blade 2 */}
          <path d="M 74 46 C 70 53, 66 60, 68 72" />
          {/* Blade 3 */}
          <path d="M 64 74 C 57 73, 49 71, 40 76" />
          {/* Blade 4 */}
          <path d="M 31 69 C 34 61, 36 53, 29 44" />
          {/* Blade 5 */}
          <path d="M 28 39 C 36 39, 43 40, 48 31" />
          {/* Blade 6 - Subtle inner aperture ring */}
          <circle cx="50" cy="52" r="16.5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.2" />
        </g>

        {/* 5. Glowing Sleek Letter "J" Combined with Camera Optical Center */}
        {/* Ambient J glow silhouette */}
        <path
          d="M 44 32 L 64 32 C 65.5 32 66 33 66 34.5 L 61 34.5 C 60 34.5 59.5 35 59.5 36.5 L 59.5 57.5 C 59.5 67 52 74 42 74 C 33.5 74 28 68.5 28 61 C 28 54.5 32.5 50.5 38 50.5 C 41 50.5 43.5 51.8 44.5 53.8 C 43.5 56.5 41 57.5 38.5 57.5 C 36 57.5 34.5 59 34.5 61 C 34.5 64.5 37.8 67.5 42.5 67.5 C 48.5 67.5 52.5 63 52.5 56.5 L 52.5 36.5 C 52.5 35 52 34.5 50.5 34.5 L 44 34.5 C 43 34.5 42.5 34 42.5 33.2 C 42.5 32.5 43 32 44 32 Z"
          fill="#FF2A6D"
          opacity="0.8"
          filter={`url(#jhalak-glow-${uniqueId})`}
        />

        {/* Crisp foreground "J" - Modern, calligraphic Indian silhouette */}
        <path
          d="M 44 32 L 64 32 C 65.5 32 66 33 66 34.5 L 61 34.5 C 60 34.5 59.5 35 59.5 36.5 L 59.5 57.5 C 59.5 67 52 74 42 74 C 33.5 74 28 68.5 28 61 C 28 54.5 32.5 50.5 38 50.5 C 41 50.5 43.5 51.8 44.5 53.8 C 43.5 56.5 41 57.5 38.5 57.5 C 36 57.5 34.5 59 34.5 61 C 34.5 64.5 37.8 67.5 42.5 67.5 C 48.5 67.5 52.5 63 52.5 56.5 L 52.5 36.5 C 52.5 35 52 34.5 50.5 34.5 L 44 34.5 C 43 34.5 42.5 34 42.5 33.2 C 42.5 32.5 43 32 44 32 Z"
          fill={`url(#jhalak-j-gradient-${uniqueId})`}
        />

        {/* Radiant Optical Light Catch on top of J */}
        <circle cx="60" cy="33.5" r="2" fill="#FFFFFF" />
        <ellipse cx="40" cy="20" rx="14" ry="4" fill="#FFFFFF" fillOpacity="0.2" transform="rotate(-18 40 20)" />
      </svg>
    </div>
  );
};
